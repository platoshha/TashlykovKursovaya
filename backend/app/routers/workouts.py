import logging
import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db, get_current_user
from app.models.models import Exercise, User, Workout, WorkoutExercise, WorkoutSet, WorkoutType
from app.schemas.workout import (
    WorkoutCreate,
    WorkoutExerciseCreate,
    WorkoutExerciseResponse,
    WorkoutExerciseUpdate,
    WorkoutListResponse,
    WorkoutResponse,
    WorkoutSetCreate,
    WorkoutSetResponse,
    WorkoutSetUpdate,
    WorkoutUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/workouts", tags=["workouts"])


def _load_workout(db: Session, workout_id: uuid.UUID, user_id: uuid.UUID) -> Workout:
    """Load a workout with relationships. Raises 404 if not found or not owned by user."""
    workout = (
        db.query(Workout)
        .options(
            joinedload(Workout.workout_type),
            joinedload(Workout.exercises).joinedload(WorkoutExercise.exercise),
            joinedload(Workout.exercises).joinedload(WorkoutExercise.sets),
        )
        .filter(Workout.id == workout_id, Workout.user_id == user_id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    return workout


def _build_workout_exercise_response(we: WorkoutExercise) -> WorkoutExerciseResponse:
    return WorkoutExerciseResponse(
        id=we.id,
        workout_id=we.workout_id,
        exercise_id=we.exercise_id,
        exercise_name=we.exercise.name,
        sort_order=we.sort_order,
        sets_count=we.sets_count,
        reps_count=we.reps_count,
        weight_kg=we.weight_kg,
        sets=[WorkoutSetResponse.model_validate(s) for s in we.sets],
    )


def _build_workout_response(workout: Workout) -> WorkoutResponse:
    return WorkoutResponse(
        id=workout.id,
        user_id=workout.user_id,
        workout_type_id=workout.workout_type_id,
        workout_type_name=workout.workout_type.name,
        workout_date=workout.workout_date,
        duration_minutes=workout.duration_minutes,
        exercises=[_build_workout_exercise_response(we) for we in workout.exercises],
        created_at=workout.created_at,
        updated_at=workout.updated_at,
    )


# ── Workouts CRUD ─────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=WorkoutListResponse,
    summary="List workouts",
    description="Returns paginated workouts for the current user, sorted by date descending.",
)
def list_workouts(
    date_from: Optional[date] = Query(None, description="Filter workouts from this date (inclusive)"),
    date_to: Optional[date] = Query(None, description="Filter workouts up to this date (inclusive)"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Workout)
        .options(
            joinedload(Workout.workout_type),
            joinedload(Workout.exercises).joinedload(WorkoutExercise.exercise),
            joinedload(Workout.exercises).joinedload(WorkoutExercise.sets),
        )
        .filter(Workout.user_id == current_user.id)
    )

    if date_from is not None:
        query = query.filter(Workout.workout_date >= date_from)
    if date_to is not None:
        query = query.filter(Workout.workout_date <= date_to)

    total = query.count()
    workouts = (
        query.order_by(Workout.workout_date.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return WorkoutListResponse(
        items=[_build_workout_response(w) for w in workouts],
        total=total,
        page=page,
        size=size,
    )


@router.post(
    "",
    response_model=WorkoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a workout",
    description="Creates a new workout for the current user.",
)
def create_workout(
    data: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout_type = db.query(WorkoutType).filter(WorkoutType.id == data.workout_type_id).first()
    if workout_type is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workout type not found")

    workout = Workout(
        user_id=current_user.id,
        workout_type_id=data.workout_type_id,
        workout_date=data.workout_date,
        duration_minutes=data.duration_minutes,
    )
    db.add(workout)
    try:
        db.commit()
        db.refresh(workout)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to create workout for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create workout")

    workout = _load_workout(db, workout.id, current_user.id)
    logger.info("User %s created workout %s", current_user.id, workout.id)
    return _build_workout_response(workout)


@router.get(
    "/{workout_id}",
    response_model=WorkoutResponse,
    summary="Get workout by ID",
    description="Returns a single workout with its exercises. Returns 404 if not found or not owned by the current user.",
)
def get_workout(
    workout_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout = _load_workout(db, workout_id, current_user.id)
    return _build_workout_response(workout)


@router.put(
    "/{workout_id}",
    response_model=WorkoutResponse,
    summary="Update a workout",
    description="Updates an existing workout. Returns 404 if not found or not owned by the current user.",
)
def update_workout(
    workout_id: uuid.UUID,
    data: WorkoutUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    if data.workout_type_id is not None:
        workout_type = db.query(WorkoutType).filter(WorkoutType.id == data.workout_type_id).first()
        if workout_type is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workout type not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workout, field, value)

    try:
        db.commit()
        db.refresh(workout)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to update workout %s: %s", workout_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update workout")

    workout = _load_workout(db, workout.id, current_user.id)
    logger.info("User %s updated workout %s", current_user.id, workout_id)
    return _build_workout_response(workout)


@router.delete(
    "/{workout_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workout",
    description="Deletes a workout and all its exercises. Returns 404 if not found or not owned by the current user.",
)
def delete_workout(
    workout_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    try:
        db.delete(workout)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete workout %s: %s", workout_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete workout")

    logger.info("User %s deleted workout %s", current_user.id, workout_id)


# ── Workout Exercises ─────────────────────────────────────────────────────────

@router.post(
    "/{workout_id}/exercises",
    response_model=WorkoutExerciseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add exercise to workout",
    description="Adds an exercise entry to a workout.",
)
def add_workout_exercise(
    workout_id: uuid.UUID,
    data: WorkoutExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify workout ownership
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    # Verify exercise exists and is accessible (system or owned by user)
    exercise = (
        db.query(Exercise)
        .filter(
            Exercise.id == data.exercise_id,
            Exercise.is_active == True,  # noqa: E712
            (Exercise.is_system == True) | (Exercise.created_by_user_id == current_user.id),  # noqa: E712
        )
        .first()
    )
    if exercise is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercise not found")

    workout_exercise = WorkoutExercise(
        workout_id=workout_id,
        exercise_id=data.exercise_id,
        sort_order=data.sort_order,
        sets_count=data.sets_count,
        reps_count=data.reps_count,
        weight_kg=data.weight_kg,
    )
    db.add(workout_exercise)
    try:
        db.commit()
        db.refresh(workout_exercise)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to add exercise to workout %s: %s", workout_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add exercise")

    # Load exercise relationship for response
    workout_exercise.exercise  # trigger lazy load (exercise is already in session)

    logger.info("User %s added exercise %s to workout %s", current_user.id, data.exercise_id, workout_id)
    return _build_workout_exercise_response(workout_exercise)


@router.put(
    "/{workout_id}/exercises/{workout_exercise_id}",
    response_model=WorkoutExerciseResponse,
    summary="Update workout exercise",
    description="Updates sets, reps, weight or sort order for an exercise in a workout.",
)
def update_workout_exercise(
    workout_id: uuid.UUID,
    workout_exercise_id: uuid.UUID,
    data: WorkoutExerciseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify workout ownership first
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    workout_exercise = (
        db.query(WorkoutExercise)
        .options(joinedload(WorkoutExercise.exercise))
        .filter(WorkoutExercise.id == workout_exercise_id, WorkoutExercise.workout_id == workout_id)
        .first()
    )
    if workout_exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout exercise not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workout_exercise, field, value)

    try:
        db.commit()
        db.refresh(workout_exercise)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to update workout exercise %s: %s", workout_exercise_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update workout exercise")

    logger.info("User %s updated workout exercise %s", current_user.id, workout_exercise_id)
    return _build_workout_exercise_response(workout_exercise)


@router.delete(
    "/{workout_id}/exercises/{workout_exercise_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove exercise from workout",
    description="Removes an exercise entry from a workout.",
)
def delete_workout_exercise(
    workout_id: uuid.UUID,
    workout_exercise_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify workout ownership first
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    workout_exercise = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.id == workout_exercise_id, WorkoutExercise.workout_id == workout_id)
        .first()
    )
    if workout_exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout exercise not found")

    try:
        db.delete(workout_exercise)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete workout exercise %s: %s", workout_exercise_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete workout exercise")

    logger.info("User %s removed exercise %s from workout %s", current_user.id, workout_exercise_id, workout_id)


# ── Workout Sets ──────────────────────────────────────────────────────────────

def _get_workout_exercise(
    db: Session,
    workout_id: uuid.UUID,
    workout_exercise_id: uuid.UUID,
    user_id: uuid.UUID,
) -> WorkoutExercise:
    """Verify ownership chain and return WorkoutExercise with sets loaded."""
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == user_id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    workout_exercise = (
        db.query(WorkoutExercise)
        .options(joinedload(WorkoutExercise.sets))
        .filter(
            WorkoutExercise.id == workout_exercise_id,
            WorkoutExercise.workout_id == workout_id,
        )
        .first()
    )
    if workout_exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout exercise not found")
    return workout_exercise


@router.post(
    "/{workout_id}/exercises/{workout_exercise_id}/sets",
    response_model=WorkoutSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a set to a workout exercise",
    description="Creates a new set record for an exercise entry in a workout.",
)
def create_workout_set(
    workout_id: uuid.UUID,
    workout_exercise_id: uuid.UUID,
    data: WorkoutSetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_workout_exercise(db, workout_id, workout_exercise_id, current_user.id)

    workout_set = WorkoutSet(
        workout_exercise_id=workout_exercise_id,
        set_number=data.set_number,
        reps_count=data.reps_count,
        weight_kg=data.weight_kg,
    )
    db.add(workout_set)
    try:
        db.commit()
        db.refresh(workout_set)
    except Exception as exc:
        db.rollback()
        logger.error(
            "Failed to create set for workout_exercise %s: %s",
            workout_exercise_id, exc, exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create workout set",
        )

    logger.info(
        "User %s created set %s (set_number=%s) for workout_exercise %s",
        current_user.id, workout_set.id, workout_set.set_number, workout_exercise_id,
    )
    return WorkoutSetResponse.model_validate(workout_set)


@router.put(
    "/{workout_id}/exercises/{workout_exercise_id}/sets/{set_id}",
    response_model=WorkoutSetResponse,
    summary="Update a workout set",
    description="Updates reps, weight, or completion status for a specific set.",
)
def update_workout_set(
    workout_id: uuid.UUID,
    workout_exercise_id: uuid.UUID,
    set_id: uuid.UUID,
    data: WorkoutSetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_workout_exercise(db, workout_id, workout_exercise_id, current_user.id)

    workout_set = (
        db.query(WorkoutSet)
        .filter(WorkoutSet.id == set_id, WorkoutSet.workout_exercise_id == workout_exercise_id)
        .first()
    )
    if workout_set is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout set not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workout_set, field, value)

    try:
        db.commit()
        db.refresh(workout_set)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to update workout set %s: %s", set_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update workout set",
        )

    logger.info("User %s updated workout set %s", current_user.id, set_id)
    return WorkoutSetResponse.model_validate(workout_set)


@router.patch(
    "/{workout_id}/exercises/{workout_exercise_id}/sets/{set_id}/complete",
    response_model=WorkoutSetResponse,
    summary="Mark a set as completed",
    description="Sets is_completed=True and records completed_at timestamp.",
)
def complete_workout_set(
    workout_id: uuid.UUID,
    workout_exercise_id: uuid.UUID,
    set_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_workout_exercise(db, workout_id, workout_exercise_id, current_user.id)

    workout_set = (
        db.query(WorkoutSet)
        .filter(WorkoutSet.id == set_id, WorkoutSet.workout_exercise_id == workout_exercise_id)
        .first()
    )
    if workout_set is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout set not found")

    workout_set.is_completed = True
    workout_set.completed_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(workout_set)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to complete workout set %s: %s", set_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete workout set",
        )

    logger.info("User %s completed workout set %s", current_user.id, set_id)
    return WorkoutSetResponse.model_validate(workout_set)


@router.delete(
    "/{workout_id}/exercises/{workout_exercise_id}/sets/{set_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workout set",
    description="Removes a set record from a workout exercise.",
)
def delete_workout_set(
    workout_id: uuid.UUID,
    workout_exercise_id: uuid.UUID,
    set_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_workout_exercise(db, workout_id, workout_exercise_id, current_user.id)

    workout_set = (
        db.query(WorkoutSet)
        .filter(WorkoutSet.id == set_id, WorkoutSet.workout_exercise_id == workout_exercise_id)
        .first()
    )
    if workout_set is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout set not found")

    try:
        db.delete(workout_set)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete workout set %s: %s", set_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete workout set",
        )

    logger.info("User %s deleted workout set %s", current_user.id, set_id)
