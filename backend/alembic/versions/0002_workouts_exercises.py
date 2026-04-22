"""workouts and exercises

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # exercises table
    op.create_table(
        "exercises",
        sa.Column(
            "id",
            sa.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "created_by_user_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "category_id",
            sa.SmallInteger(),
            sa.ForeignKey("exercise_categories.id"),
            nullable=True,
        ),
        sa.Column("name", sa.VARCHAR(100), nullable=False),
        sa.Column("description", sa.TEXT(), nullable=True),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_exercises_created_by_user_id", "exercises", ["created_by_user_id"])
    # Partial unique indexes for exercises
    op.execute(
        "CREATE UNIQUE INDEX uq_exercises_system_name ON exercises (name) WHERE is_system = TRUE"
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_exercises_user_name ON exercises (created_by_user_id, name) WHERE is_system = FALSE"
    )

    # workouts table
    op.create_table(
        "workouts",
        sa.Column(
            "id",
            sa.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "workout_type_id",
            sa.SmallInteger(),
            sa.ForeignKey("workout_types.id"),
            nullable=False,
        ),
        sa.Column("workout_date", sa.Date(), nullable=False),
        sa.Column("duration_minutes", sa.INTEGER(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "duration_minutes >= 1 AND duration_minutes <= 1440",
            name="ck_workouts_duration_minutes",
        ),
    )
    op.create_index("ix_workouts_user_id", "workouts", ["user_id"])

    # workout_exercises table
    op.create_table(
        "workout_exercises",
        sa.Column(
            "id",
            sa.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "workout_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("workouts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "exercise_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("exercises.id"),
            nullable=False,
        ),
        sa.Column("sort_order", sa.INTEGER(), nullable=False, server_default=sa.text("0")),
        sa.Column("sets_count", sa.INTEGER(), nullable=False),
        sa.Column("reps_count", sa.INTEGER(), nullable=False),
        sa.Column("weight_kg", sa.NUMERIC(6, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "sets_count >= 1 AND sets_count <= 100",
            name="ck_workout_exercises_sets_count",
        ),
        sa.CheckConstraint(
            "reps_count >= 1 AND reps_count <= 1000",
            name="ck_workout_exercises_reps_count",
        ),
        sa.CheckConstraint("weight_kg >= 0", name="ck_workout_exercises_weight_kg"),
    )
    op.create_index("ix_workout_exercises_workout_id", "workout_exercises", ["workout_id"])


def downgrade() -> None:
    op.drop_index("ix_workout_exercises_workout_id", table_name="workout_exercises")
    op.drop_table("workout_exercises")
    op.drop_index("ix_workouts_user_id", table_name="workouts")
    op.drop_table("workouts")
    op.drop_index("uq_exercises_user_name", table_name="exercises")
    op.drop_index("uq_exercises_system_name", table_name="exercises")
    op.drop_index("ix_exercises_created_by_user_id", table_name="exercises")
    op.drop_table("exercises")
