import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.models.goal import UserGoal
from app.models.models import GoalType
from app.schemas.goal import GoalCreate, GoalUpdate

logger = logging.getLogger(__name__)


def _load_goal_with_type(db: Session, goal_id: uuid.UUID, user_id: uuid.UUID) -> UserGoal | None:
    return (
        db.query(UserGoal)
        .options(joinedload(UserGoal.goal_type))
        .filter(UserGoal.id == goal_id, UserGoal.user_id == user_id)
        .first()
    )


def get_goals(
    db: Session,
    user_id: uuid.UUID,
) -> tuple[list[UserGoal], int]:
    query = (
        db.query(UserGoal)
        .options(joinedload(UserGoal.goal_type))
        .filter(UserGoal.user_id == user_id)
        .order_by(UserGoal.created_at.desc())
    )
    total = query.count()
    items = query.all()
    return items, total


def get_goal_by_id(
    db: Session,
    goal_id: uuid.UUID,
    user_id: uuid.UUID,
) -> UserGoal | None:
    return _load_goal_with_type(db, goal_id, user_id)


def get_goal_type(db: Session, goal_type_id: int) -> GoalType | None:
    return db.query(GoalType).filter(GoalType.id == goal_type_id).first()


def create_goal(
    db: Session,
    user_id: uuid.UUID,
    data: GoalCreate,
) -> UserGoal:
    goal = UserGoal(
        user_id=user_id,
        goal_type_id=data.goal_type_id,
        target_value=data.target_value,
        target_date=data.target_date,
        notes=data.notes,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    # reload with relationship
    goal = _load_goal_with_type(db, goal.id, user_id)
    logger.info("User %s created goal %s", user_id, goal.id)
    return goal


def update_goal(
    db: Session,
    goal_id: uuid.UUID,
    user_id: uuid.UUID,
    data: GoalUpdate,
) -> UserGoal | None:
    goal = (
        db.query(UserGoal)
        .filter(UserGoal.id == goal_id, UserGoal.user_id == user_id)
        .first()
    )
    if goal is None:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    goal = _load_goal_with_type(db, goal_id, user_id)
    logger.info("Updated goal %s", goal_id)
    return goal


def achieve_goal(
    db: Session,
    goal_id: uuid.UUID,
    user_id: uuid.UUID,
) -> UserGoal | None:
    goal = (
        db.query(UserGoal)
        .filter(UserGoal.id == goal_id, UserGoal.user_id == user_id)
        .first()
    )
    if goal is None:
        return None
    goal.is_achieved = True
    goal.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(goal)
    goal = _load_goal_with_type(db, goal_id, user_id)
    logger.info("Goal %s marked as achieved by user %s", goal_id, user_id)
    return goal


def delete_goal(db: Session, goal_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    goal = (
        db.query(UserGoal)
        .filter(UserGoal.id == goal_id, UserGoal.user_id == user_id)
        .first()
    )
    if goal is None:
        return False
    db.delete(goal)
    db.commit()
    logger.info("Deleted goal %s", goal_id)
    return True
