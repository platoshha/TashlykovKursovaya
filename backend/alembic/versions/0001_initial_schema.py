"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgcrypto for gen_random_uuid() — safe to run multiple times
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "workout_types",
        sa.Column("id", sa.SmallInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.VARCHAR(30), nullable=False),
        sa.Column("name", sa.VARCHAR(50), nullable=False),
        sa.UniqueConstraint("code", name="uq_workout_types_code"),
        sa.UniqueConstraint("name", name="uq_workout_types_name"),
    )

    op.create_table(
        "exercise_categories",
        sa.Column("id", sa.SmallInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.VARCHAR(30), nullable=False),
        sa.Column("name", sa.VARCHAR(50), nullable=False),
        sa.UniqueConstraint("code", name="uq_exercise_categories_code"),
        sa.UniqueConstraint("name", name="uq_exercise_categories_name"),
    )

    op.create_table(
        "goal_types",
        sa.Column("id", sa.SmallInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.VARCHAR(30), nullable=False),
        sa.Column("name", sa.VARCHAR(50), nullable=False),
        sa.UniqueConstraint("code", name="uq_goal_types_code"),
        sa.UniqueConstraint("name", name="uq_goal_types_name"),
    )

    op.create_table(
        "users",
        sa.Column(
            "id",
            sa.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", sa.VARCHAR(255), nullable=False),
        sa.Column("password_hash", sa.VARCHAR(255), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "user_profiles",
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("name", sa.VARCHAR(100), nullable=False),
        sa.Column("age", sa.INTEGER(), nullable=True),
        sa.Column("height_cm", sa.INTEGER(), nullable=True),
        sa.Column("current_weight_kg", sa.NUMERIC(5, 2), nullable=True),
        sa.Column("training_level", sa.VARCHAR(20), nullable=False, server_default="beginner"),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("age >= 10 AND age <= 100", name="ck_user_profiles_age"),
        sa.CheckConstraint("height_cm >= 50 AND height_cm <= 300", name="ck_user_profiles_height_cm"),
        sa.CheckConstraint("current_weight_kg > 0", name="ck_user_profiles_current_weight_kg"),
        sa.CheckConstraint(
            "training_level IN ('beginner', 'intermediate', 'advanced')",
            name="ck_user_profiles_training_level",
        ),
    )


def downgrade() -> None:
    op.drop_table("user_profiles")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("goal_types")
    op.drop_table("exercise_categories")
    op.drop_table("workout_types")
