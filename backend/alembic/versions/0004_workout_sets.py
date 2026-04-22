"""add workout_sets table

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'workout_sets',
        sa.Column('id', sa.UUID(as_uuid=True), primary_key=True),
        sa.Column('workout_exercise_id', sa.UUID(as_uuid=True),
                  sa.ForeignKey('workout_exercises.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('set_number', sa.Integer(), nullable=False),
        sa.Column('reps_count', sa.Integer(), nullable=False),
        sa.Column('weight_kg', sa.Numeric(6, 2), nullable=False, server_default='0'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.UniqueConstraint('workout_exercise_id', 'set_number',
                            name='uq_workout_sets_exercise_number'),
        sa.CheckConstraint('reps_count >= 1 AND reps_count <= 1000',
                           name='ck_workout_sets_reps'),
        sa.CheckConstraint('weight_kg >= 0', name='ck_workout_sets_weight'),
        sa.CheckConstraint('set_number >= 1', name='ck_workout_sets_number'),
    )
    op.create_index('idx_workout_sets_exercise', 'workout_sets',
                    ['workout_exercise_id'])


def downgrade() -> None:
    op.drop_index('idx_workout_sets_exercise', table_name='workout_sets')
    op.drop_table('workout_sets')
