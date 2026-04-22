import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


class MeasurementCreate(BaseModel):
    measured_at: date
    weight_kg: Optional[Decimal] = None
    body_fat_pct: Optional[Decimal] = None
    notes: Optional[str] = None

    @field_validator("weight_kg")
    @classmethod
    def weight_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("weight_kg must be greater than 0")
        return v

    @field_validator("body_fat_pct")
    @classmethod
    def body_fat_range(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("body_fat_pct must be between 0 and 100")
        return v


class MeasurementUpdate(BaseModel):
    measured_at: Optional[date] = None
    weight_kg: Optional[Decimal] = None
    body_fat_pct: Optional[Decimal] = None
    notes: Optional[str] = None

    @field_validator("weight_kg")
    @classmethod
    def weight_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("weight_kg must be greater than 0")
        return v

    @field_validator("body_fat_pct")
    @classmethod
    def body_fat_range(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("body_fat_pct must be between 0 and 100")
        return v


class MeasurementResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    measured_at: date
    weight_kg: Optional[Decimal]
    body_fat_pct: Optional[Decimal]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class MeasurementListResponse(BaseModel):
    items: list[MeasurementResponse]
    total: int
