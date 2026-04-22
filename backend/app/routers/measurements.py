import logging
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.models import User
from app.schemas.measurement import (
    MeasurementCreate,
    MeasurementListResponse,
    MeasurementResponse,
    MeasurementUpdate,
)
from app.services import measurement_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=MeasurementListResponse,
    summary="List body measurements",
    description="Returns body measurements for the current user ordered by measured_at.",
)
def list_measurements(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of records to return"),
    order: Literal["asc", "desc"] = Query("desc", description="Sort order by measured_at"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = measurement_service.get_measurements(db, current_user.id, skip, limit, order)
    return MeasurementListResponse(items=items, total=total)


@router.post(
    "",
    response_model=MeasurementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create body measurement",
    description="Creates a new body measurement entry for the current user.",
)
def create_measurement(
    data: MeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        measurement = measurement_service.create_measurement(db, current_user.id, data)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to create measurement for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create measurement",
        )
    return measurement


@router.get(
    "/{measurement_id}",
    response_model=MeasurementResponse,
    summary="Get body measurement by ID",
    description="Returns a single body measurement. Returns 404 if not found or not owned by the current user.",
)
def get_measurement(
    measurement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    measurement = measurement_service.get_measurement_by_id(db, measurement_id, current_user.id)
    if measurement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found")
    return measurement


@router.put(
    "/{measurement_id}",
    response_model=MeasurementResponse,
    summary="Update body measurement",
    description="Updates an existing body measurement. Returns 404 if not found or not owned by the current user.",
)
def update_measurement(
    measurement_id: uuid.UUID,
    data: MeasurementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    measurement = measurement_service.get_measurement_by_id(db, measurement_id, current_user.id)
    if measurement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found")

    try:
        measurement = measurement_service.update_measurement(db, measurement, data)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to update measurement %s: %s", measurement_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update measurement",
        )
    return measurement


@router.delete(
    "/{measurement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete body measurement",
    description="Deletes a body measurement. Returns 404 if not found or not owned by the current user.",
)
def delete_measurement(
    measurement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    measurement = measurement_service.get_measurement_by_id(db, measurement_id, current_user.id)
    if measurement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found")

    try:
        measurement_service.delete_measurement(db, measurement)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete measurement %s: %s", measurement_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete measurement",
        )
