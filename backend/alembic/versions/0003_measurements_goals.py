"""measurements and goals

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # body_measurements table
    op.create_table(
        "body_measurements",
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
        sa.Column("measured_at", sa.Date(), nullable=False),
        sa.Column("weight_kg", sa.NUMERIC(5, 2), nullable=True),
        sa.Column("body_fat_pct", sa.NUMERIC(4, 1), nullable=True),
        sa.Column("notes", sa.TEXT(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_body_measurements_user_id", "body_measurements", ["user_id"])

    # user_goals table (goal_types already exists from 0001)
    op.create_table(
        "user_goals",
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
            "goal_type_id",
            sa.SmallInteger(),
            sa.ForeignKey("goal_types.id"),
            nullable=False,
        ),
        sa.Column("target_value", sa.NUMERIC(7, 2), nullable=True),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("is_achieved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.TEXT(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_user_goals_user_id", "user_goals", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_goals_user_id", table_name="user_goals")
    op.drop_table("user_goals")
    op.drop_index("ix_body_measurements_user_id", table_name="body_measurements")
    op.drop_table("body_measurements")
