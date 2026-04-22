import logging
import uuid
from typing import Literal

from sqlalchemy.orm import Session

from app.models.measurement import BodyMeasurement
from app.schemas.measurement import MeasurementCreate, MeasurementUpdate

logger = logging.getLogger(__name__)


def get_measurements(
    db: Session,
    user_id: uuid.UUID,
    skip: int,
    limit: int,
    order: Literal["asc", "desc"],
) -> tuple[list[BodyMeasurement], int]:
    query = db.query(BodyMeasurement).filter(BodyMeasurement.user_id == user_id)
    total = query.count()
    if order == "asc":
        query = query.order_by(BodyMeasurement.measured_at.asc())
    else:
        query = query.order_by(BodyMeasurement.measured_at.desc())
    items = query.offset(skip).limit(limit).all()
    return items, total


def get_measurement_by_id(
    db: Session,
    measurement_id: uuid.UUID,
    user_id: uuid.UUID,
) -> BodyMeasurement | None:
    return (
        db.query(BodyMeasurement)
        .filter(BodyMeasurement.id == measurement_id, BodyMeasurement.user_id == user_id)
        .first()
    )


def create_measurement(
    db: Session,
    user_id: uuid.UUID,
    data: MeasurementCreate,
) -> BodyMeasurement:
    measurement = BodyMeasurement(
        user_id=user_id,
        measured_at=data.measured_at,
        weight_kg=data.weight_kg,
        body_fat_pct=data.body_fat_pct,
        notes=data.notes,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    logger.info("User %s created body measurement %s", user_id, measurement.id)
    return measurement


def update_measurement(
    db: Session,
    measurement: BodyMeasurement,
    data: MeasurementUpdate,
) -> BodyMeasurement:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(measurement, field, value)
    db.commit()
    db.refresh(measurement)
    logger.info("Updated body measurement %s", measurement.id)
    return measurement


def delete_measurement(db: Session, measurement: BodyMeasurement) -> None:
    db.delete(measurement)
    db.commit()
    logger.info("Deleted body measurement %s", measurement.id)
