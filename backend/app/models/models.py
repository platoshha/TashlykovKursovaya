import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    UUID, VARCHAR, INTEGER, NUMERIC, SMALLINT, TIMESTAMP, TEXT,
    ForeignKey, CheckConstraint, UniqueConstraint, func, Boolean, Date, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(VARCHAR(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    workouts: Mapped[list["Workout"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    __table_args__ = (
        CheckConstraint("age >= 10 AND age <= 100", name="ck_user_profiles_age"),
        CheckConstraint("height_cm >= 50 AND height_cm <= 300", name="ck_user_profiles_height_cm"),
        CheckConstraint("current_weight_kg > 0", name="ck_user_profiles_current_weight_kg"),
        CheckConstraint(
            "training_level IN ('beginner', 'intermediate', 'advanced')",
            name="ck_user_profiles_training_level",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    age: Mapped[int | None] = mapped_column(INTEGER, nullable=True)
    height_cm: Mapped[int | None] = mapped_column(INTEGER, nullable=True)
    current_weight_kg: Mapped[float | None] = mapped_column(NUMERIC(5, 2), nullable=True)
    training_level: Mapped[str] = mapped_column(VARCHAR(20), nullable=False, server_default="beginner")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="profile")


class WorkoutType(Base):
    __tablename__ = "workout_types"

    id: Mapped[int] = mapped_column(SMALLINT, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(VARCHAR(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(VARCHAR(50), unique=True, nullable=False)

    workouts: Mapped[list["Workout"]] = relationship(back_populates="workout_type")


class ExerciseCategory(Base):
    __tablename__ = "exercise_categories"

    id: Mapped[int] = mapped_column(SMALLINT, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(VARCHAR(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(VARCHAR(50), unique=True, nullable=False)

    exercises: Mapped[list["Exercise"]] = relationship(back_populates="category")


class GoalType(Base):
    __tablename__ = "goal_types"

    id: Mapped[int] = mapped_column(SMALLINT, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(VARCHAR(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(VARCHAR(50), unique=True, nullable=False)


class Workout(Base):
    __tablename__ = "workouts"

    __table_args__ = (
        CheckConstraint(
            "duration_minutes >= 1 AND duration_minutes <= 1440",
            name="ck_workouts_duration_minutes",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workout_type_id: Mapped[int] = mapped_column(
        SMALLINT, ForeignKey("workout_types.id"), nullable=False
    )
    workout_date: Mapped[date] = mapped_column(Date, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(INTEGER, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="workouts")
    workout_type: Mapped["WorkoutType"] = relationship(back_populates="workouts")
    exercises: Mapped[list["WorkoutExercise"]] = relationship(
        back_populates="workout", cascade="all, delete-orphan", order_by="WorkoutExercise.sort_order"
    )


class Exercise(Base):
    __tablename__ = "exercises"

    __table_args__ = (
        Index(
            "uq_exercises_system_name",
            "name",
            unique=True,
            postgresql_where=TEXT("is_system = TRUE"),
        ),
        Index(
            "uq_exercises_user_name",
            "created_by_user_id",
            "name",
            unique=True,
            postgresql_where=TEXT("is_system = FALSE"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        SMALLINT, ForeignKey("exercise_categories.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    description: Mapped[str | None] = mapped_column(TEXT, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    category: Mapped["ExerciseCategory | None"] = relationship(back_populates="exercises")
    workout_exercises: Mapped[list["WorkoutExercise"]] = relationship(back_populates="exercise")


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    __table_args__ = (
        CheckConstraint("sets_count >= 1 AND sets_count <= 100", name="ck_workout_exercises_sets_count"),
        CheckConstraint("reps_count >= 1 AND reps_count <= 1000", name="ck_workout_exercises_reps_count"),
        CheckConstraint("weight_kg >= 0", name="ck_workout_exercises_weight_kg"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exercises.id"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(INTEGER, nullable=False, default=0, server_default="0")
    sets_count: Mapped[int] = mapped_column(INTEGER, nullable=False)
    reps_count: Mapped[int] = mapped_column(INTEGER, nullable=False)
    weight_kg: Mapped[Decimal] = mapped_column(NUMERIC(6, 2), nullable=False, default=Decimal("0"), server_default="0")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    workout: Mapped["Workout"] = relationship(back_populates="exercises")
    exercise: Mapped["Exercise"] = relationship(back_populates="workout_exercises")
    sets: Mapped[list["WorkoutSet"]] = relationship(
        back_populates="workout_exercise", cascade="all, delete-orphan",
        order_by="WorkoutSet.set_number"
    )


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    __table_args__ = (
        UniqueConstraint("workout_exercise_id", "set_number", name="uq_workout_sets_exercise_number"),
        CheckConstraint("reps_count >= 1 AND reps_count <= 1000", name="ck_workout_sets_reps"),
        CheckConstraint("weight_kg >= 0", name="ck_workout_sets_weight"),
        CheckConstraint("set_number >= 1", name="ck_workout_sets_number"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workout_exercises.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    set_number: Mapped[int] = mapped_column(INTEGER, nullable=False)
    reps_count: Mapped[int] = mapped_column(INTEGER, nullable=False)
    weight_kg: Mapped[Decimal] = mapped_column(NUMERIC(6, 2), nullable=False, default=Decimal("0"), server_default="0")
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, server_default=func.now())

    workout_exercise: Mapped["WorkoutExercise"] = relationship(back_populates="sets")
