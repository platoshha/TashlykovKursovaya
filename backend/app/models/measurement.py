import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import UUID, NUMERIC, TIMESTAMP, TEXT, Date, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BodyMeasurement(Base):
    __tablename__ = "body_measurements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    measured_at: Mapped[date] = mapped_column(Date, nullable=False)
    weight_kg: Mapped[Decimal | None] = mapped_column(NUMERIC(5, 2), nullable=True)
    body_fat_pct: Mapped[Decimal | None] = mapped_column(NUMERIC(4, 1), nullable=True)
    notes: Mapped[str | None] = mapped_column(TEXT, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, server_default=func.now())

    user: Mapped["User"] = relationship(foreign_keys=[user_id])  # type: ignore[name-defined]
