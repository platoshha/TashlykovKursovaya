import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.models import User
from app.schemas.goal import (
    GoalCreate,
    GoalListResponse,
    GoalResponse,
    GoalUpdate,
)
from app.services import goal_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _build_goal_response(goal) -> GoalResponse:
    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        goal_type_id=goal.goal_type_id,
        goal_type_name=goal.goal_type.name,
        goal_type_code=goal.goal_type.code,
        target_value=goal.target_value,
        target_date=goal.target_date,
        is_achieved=goal.is_achieved,
        notes=goal.notes,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


@router.get(
    "",
    response_model=GoalListResponse,
    summary="List goals",
    description="Returns all goals for the current user.",
)
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = goal_service.get_goals(db, current_user.id)
    return GoalListResponse(items=[_build_goal_response(g) for g in items], total=total)


@router.post(
    "",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create goal",
    description="Creates a new goal for the current user.",
)
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal_type = goal_service.get_goal_type(db, data.goal_type_id)
    if goal_type is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Goal type not found")

    try:
        goal = goal_service.create_goal(db, current_user.id, data)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to create goal for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create goal",
        )
    return _build_goal_response(goal)


@router.get(
    "/{goal_id}",
    response_model=GoalResponse,
    summary="Get goal by ID",
    description="Returns a single goal. Returns 404 if not found or not owned by the current user.",
)
def get_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = goal_service.get_goal_by_id(db, goal_id, current_user.id)
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return _build_goal_response(goal)


@router.put(
    "/{goal_id}",
    response_model=GoalResponse,
    summary="Update goal",
    description="Updates an existing goal. Returns 404 if not found or not owned by the current user.",
)
def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.goal_type_id is not None:
        goal_type = goal_service.get_goal_type(db, data.goal_type_id)
        if goal_type is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Goal type not found")

    try:
        goal = goal_service.update_goal(db, goal_id, current_user.id, data)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to update goal %s: %s", goal_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update goal",
        )

    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return _build_goal_response(goal)


@router.patch(
    "/{goal_id}/achieve",
    response_model=GoalResponse,
    summary="Mark goal as achieved",
    description="Sets is_achieved=True and updates updated_at timestamp.",
)
def achieve_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        goal = goal_service.achieve_goal(db, goal_id, current_user.id)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to achieve goal %s: %s", goal_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update goal",
        )

    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    logger.info("User %s achieved goal %s", current_user.id, goal_id)
    return _build_goal_response(goal)


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete goal",
    description="Deletes a goal. Returns 404 if not found or not owned by the current user.",
)
def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        deleted = goal_service.delete_goal(db, goal_id, current_user.id)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete goal %s: %s", goal_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete goal",
        )

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
