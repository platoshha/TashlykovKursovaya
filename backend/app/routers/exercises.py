import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db, get_current_user
from app.models.models import Exercise, ExerciseCategory, User
from app.schemas.exercise import (
    ExerciseCreate,
    ExerciseListResponse,
    ExerciseResponse,
    ExerciseUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/exercises", tags=["exercises"])


def _build_exercise_response(exercise: Exercise) -> ExerciseResponse:
    """Convert an ORM Exercise to ExerciseResponse, resolving category_name."""
    return ExerciseResponse(
        id=exercise.id,
        name=exercise.name,
        description=exercise.description,
        category_id=exercise.category_id,
        category_name=exercise.category.name if exercise.category else None,
        is_system=exercise.is_system,
        created_by_user_id=exercise.created_by_user_id,
        created_at=exercise.created_at,
    )


@router.get(
    "",
    response_model=ExerciseListResponse,
    summary="List exercises",
    description=(
        "Returns system exercises and the current user's own exercises. "
        "Supports optional filtering by name (search) and category_id."
    ),
)
def list_exercises(
    search: Optional[str] = Query(None, description="Filter by exercise name (case-insensitive substring)"),
    category_id: Optional[int] = Query(None, description="Filter by exercise category ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Exercise)
        .options(joinedload(Exercise.category))
        .filter(
            Exercise.is_active == True,  # noqa: E712
            (Exercise.is_system == True) | (Exercise.created_by_user_id == current_user.id),  # noqa: E712
        )
    )

    if search:
        query = query.filter(Exercise.name.ilike(f"%{search}%"))
    if category_id is not None:
        query = query.filter(Exercise.category_id == category_id)

    total = query.count()
    exercises = query.order_by(Exercise.name).offset((page - 1) * size).limit(size).all()

    return ExerciseListResponse(
        items=[_build_exercise_response(e) for e in exercises],
        total=total,
    )


@router.post(
    "",
    response_model=ExerciseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a custom exercise",
    description="Creates a new exercise owned by the current user (is_system=False).",
)
def create_exercise(
    data: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.category_id is not None:
        category = db.query(ExerciseCategory).filter(ExerciseCategory.id == data.category_id).first()
        if category is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")

    exercise = Exercise(
        created_by_user_id=current_user.id,
        category_id=data.category_id,
        name=data.name,
        description=data.description,
        is_system=False,
        is_active=True,
    )
    db.add(exercise)
    try:
        db.commit()
        db.refresh(exercise)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An exercise with this name already exists in your library",
        )
    except Exception as exc:
        db.rollback()
        logger.error("Failed to create exercise for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create exercise")

    # Reload with category relationship
    db.refresh(exercise)
    if exercise.category_id:
        _ = exercise.category

    logger.info("User %s created exercise '%s'", current_user.id, exercise.name)
    return _build_exercise_response(exercise)


@router.get(
    "/{exercise_id}",
    response_model=ExerciseResponse,
    summary="Get exercise by ID",
    description="Returns a system exercise or a user-owned exercise. Returns 404 if not found or not accessible.",
)
def get_exercise(
    exercise_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exercise = (
        db.query(Exercise)
        .options(joinedload(Exercise.category))
        .filter(Exercise.id == exercise_id, Exercise.is_active == True)  # noqa: E712
        .first()
    )
    if exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

    if not exercise.is_system and exercise.created_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

    return _build_exercise_response(exercise)


@router.put(
    "/{exercise_id}",
    response_model=ExerciseResponse,
    summary="Update a custom exercise",
    description="Updates the current user's own exercise. Returns 403 for system exercises or exercises owned by another user.",
)
def update_exercise(
    exercise_id: uuid.UUID,
    data: ExerciseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exercise = (
        db.query(Exercise)
        .options(joinedload(Exercise.category))
        .filter(Exercise.id == exercise_id, Exercise.is_active == True)  # noqa: E712
        .first()
    )
    if exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

    if exercise.is_system:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="System exercises cannot be modified")

    if exercise.created_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this exercise")

    if data.category_id is not None:
        category = db.query(ExerciseCategory).filter(ExerciseCategory.id == data.category_id).first()
        if category is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exercise, field, value)

    try:
        db.commit()
        db.refresh(exercise)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An exercise with this name already exists in your library",
        )
    except Exception as exc:
        db.rollback()
        logger.error("Failed to update exercise %s: %s", exercise_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update exercise")

    # Reload category after potential category_id change
    if exercise.category_id:
        exercise.category  # trigger load

    logger.info("User %s updated exercise %s", current_user.id, exercise_id)
    return _build_exercise_response(exercise)


@router.delete(
    "/{exercise_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a custom exercise",
    description="Soft-deletes the current user's own exercise (sets is_active=False). Returns 403 for system exercises or exercises owned by another user.",
)
def delete_exercise(
    exercise_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exercise = (
        db.query(Exercise)
        .filter(Exercise.id == exercise_id, Exercise.is_active == True)  # noqa: E712
        .first()
    )
    if exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

    if exercise.is_system:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="System exercises cannot be deleted")

    if exercise.created_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this exercise")

    exercise.is_active = False
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete exercise %s: %s", exercise_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete exercise")

    logger.info("User %s deleted exercise %s", current_user.id, exercise_id)
