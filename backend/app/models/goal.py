import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import UUID, NUMERIC, TIMESTAMP, TEXT, SMALLINT, Date, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserGoal(Base):
    __tablename__ = "user_goals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    goal_type_id: Mapped[int] = mapped_column(
        SMALLINT, ForeignKey("goal_types.id"), nullable=False
    )
    target_value: Mapped[Decimal | None] = mapped_column(NUMERIC(7, 2), nullable=True)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_achieved: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    notes: Mapped[str | None] = mapped_column(TEXT, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(foreign_keys=[user_id])  # type: ignore[name-defined]
    goal_type: Mapped["GoalType"] = relationship()  # type: ignore[name-defined]
