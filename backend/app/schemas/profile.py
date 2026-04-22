import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


class ProfileResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    age: Optional[int]
    height_cm: Optional[int]
    current_weight_kg: Optional[Decimal]
    training_level: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[int] = None
    current_weight_kg: Optional[Decimal] = None
    training_level: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name must not be empty")
        return v

    @field_validator("age")
    @classmethod
    def age_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (10 <= v <= 100):
            raise ValueError("Age must be between 10 and 100")
        return v

    @field_validator("height_cm")
    @classmethod
    def height_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (50 <= v <= 300):
            raise ValueError("Height must be between 50 and 300 cm")
        return v

    @field_validator("current_weight_kg")
    @classmethod
    def weight_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Weight must be greater than 0")
        return v

    @field_validator("training_level")
    @classmethod
    def training_level_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("beginner", "intermediate", "advanced"):
            raise ValueError("training_level must be one of: beginner, intermediate, advanced")
        return v
