import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.models import WorkoutType, ExerciseCategory, GoalType
from app.schemas.workout import WorkoutTypeResponse
from app.schemas.exercise import ExerciseCategoryResponse
from app.schemas.goal import GoalTypeResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["reference"])


@router.get(
    "/workout-types",
    response_model=list[WorkoutTypeResponse],
    summary="List workout types",
    description="Returns all available workout types. No authentication required.",
)
def get_workout_types(db: Session = Depends(get_db)):
    return db.query(WorkoutType).order_by(WorkoutType.id).all()


@router.get(
    "/exercise-categories",
    response_model=list[ExerciseCategoryResponse],
    summary="List exercise categories",
    description="Returns all available exercise categories. No authentication required.",
)
def get_exercise_categories(db: Session = Depends(get_db)):
    return db.query(ExerciseCategory).order_by(ExerciseCategory.id).all()


@router.get(
    "/goal-types",
    response_model=list[GoalTypeResponse],
    summary="List goal types",
    description="Returns all available goal types. No authentication required.",
)
def get_goal_types(db: Session = Depends(get_db)):
    return db.query(GoalType).order_by(GoalType.id).all()
