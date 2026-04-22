import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db, get_current_user
from app.models.measurement import BodyMeasurement
from app.models.goal import UserGoal
from app.models.models import User, Workout, WorkoutExercise

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/dashboard",
    summary="Dashboard statistics",
    description=(
        "Returns aggregate statistics for the current user: workout counts, total volume, "
        "latest weight, goal summary, workouts per month (last 6 months), and weight history (last 30 measurements)."
    ),
)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

    # Total workouts
    total_workouts: int = (
        db.query(func.count(Workout.id))
        .filter(Workout.user_id == user_id)
        .scalar() or 0
    )

    # Workouts this month
    today = date.today()
    first_of_month = today.replace(day=1)
    workouts_this_month: int = (
        db.query(func.count(Workout.id))
        .filter(Workout.user_id == user_id, Workout.workout_date >= first_of_month)
        .scalar() or 0
    )

    # Total volume: sum(sets_count * reps_count * weight_kg) across all workout_exercises joined with workouts
    total_volume_row = (
        db.query(
            func.coalesce(
                func.sum(
                    WorkoutExercise.sets_count * WorkoutExercise.reps_count * WorkoutExercise.weight_kg
                ),
                0,
            )
        )
        .join(Workout, WorkoutExercise.workout_id == Workout.id)
        .filter(Workout.user_id == user_id)
        .scalar()
    )
    total_volume_kg: float = float(total_volume_row) if total_volume_row is not None else 0.0

    # Latest weight_kg from body_measurements
    latest_measurement = (
        db.query(BodyMeasurement.weight_kg)
        .filter(
            BodyMeasurement.user_id == user_id,
            BodyMeasurement.weight_kg.isnot(None),
        )
        .order_by(BodyMeasurement.measured_at.desc())
        .first()
    )
    latest_weight_kg = float(latest_measurement.weight_kg) if latest_measurement else None

    # Active goals count
    active_goals_count: int = (
        db.query(func.count(UserGoal.id))
        .filter(UserGoal.user_id == user_id, UserGoal.is_achieved == False)  # noqa: E712
        .scalar() or 0
    )

    # Achieved goals count
    achieved_goals_count: int = (
        db.query(func.count(UserGoal.id))
        .filter(UserGoal.user_id == user_id, UserGoal.is_achieved == True)  # noqa: E712
        .scalar() or 0
    )

    # Workouts per month — last 6 months
    # Build the list of the last 6 calendar months (including current)
    months = []
    for i in range(5, -1, -1):
        # Calculate month offset
        month_date = today.replace(day=1)
        total_months = month_date.year * 12 + month_date.month - 1 - i
        year = total_months // 12
        month = total_months % 12 + 1
        months.append((year, month))

    # Query counts grouped by year+month
    monthly_rows = (
        db.query(
            extract("year", Workout.workout_date).label("yr"),
            extract("month", Workout.workout_date).label("mo"),
            func.count(Workout.id).label("cnt"),
        )
        .filter(
            Workout.user_id == user_id,
            Workout.workout_date >= date(months[0][0], months[0][1], 1),
        )
        .group_by("yr", "mo")
        .all()
    )
    monthly_map = {(int(r.yr), int(r.mo)): int(r.cnt) for r in monthly_rows}

    workouts_per_month = [
        {"month": f"{yr:04d}-{mo:02d}", "count": monthly_map.get((yr, mo), 0)}
        for yr, mo in months
    ]

    # Weight history — last 30 measurements ordered by date
    weight_rows = (
        db.query(BodyMeasurement.measured_at, BodyMeasurement.weight_kg)
        .filter(
            BodyMeasurement.user_id == user_id,
            BodyMeasurement.weight_kg.isnot(None),
        )
        .order_by(BodyMeasurement.measured_at.desc())
        .limit(30)
        .all()
    )
    weight_history = [
        {"date": str(r.measured_at), "weight_kg": float(r.weight_kg)}
        for r in reversed(weight_rows)
    ]

    # Latest workout
    latest_workout_row = (
        db.query(Workout)
        .options(joinedload(Workout.workout_type))
        .filter(Workout.user_id == user_id)
        .order_by(Workout.workout_date.desc(), Workout.created_at.desc())
        .first()
    )

    latest_workout = None
    if latest_workout_row is not None:
        exercises_count = (
            db.query(func.count(WorkoutExercise.id))
            .filter(WorkoutExercise.workout_id == latest_workout_row.id)
            .scalar() or 0
        )
        latest_workout = {
            "id": str(latest_workout_row.id),
            "workout_type_name": latest_workout_row.workout_type.name,
            "workout_date": str(latest_workout_row.workout_date),
            "duration_minutes": latest_workout_row.duration_minutes,
            "exercises_count": int(exercises_count),
        }

    return {
        "total_workouts": total_workouts,
        "workouts_this_month": workouts_this_month,
        "total_volume_kg": total_volume_kg,
        "latest_weight_kg": latest_weight_kg,
        "active_goals_count": active_goals_count,
        "achieved_goals_count": achieved_goals_count,
        "workouts_per_month": workouts_per_month,
        "weight_history": weight_history,
        "latest_workout": latest_workout,
    }
