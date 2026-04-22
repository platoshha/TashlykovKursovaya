import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


class WorkoutTypeResponse(BaseModel):
    id: int
    code: str
    name: str

    model_config = {"from_attributes": True}


class WorkoutExerciseCreate(BaseModel):
    exercise_id: uuid.UUID
    sets_count: int
    reps_count: int
    weight_kg: Decimal = Decimal("0")
    sort_order: int = 0

    @field_validator("sets_count")
    @classmethod
    def sets_range(cls, v: int) -> int:
        if not (1 <= v <= 100):
            raise ValueError("sets_count must be between 1 and 100")
        return v

    @field_validator("reps_count")
    @classmethod
    def reps_range(cls, v: int) -> int:
        if not (1 <= v <= 1000):
            raise ValueError("reps_count must be between 1 and 1000")
        return v

    @field_validator("weight_kg")
    @classmethod
    def weight_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("weight_kg must be >= 0")
        return v


class WorkoutExerciseUpdate(BaseModel):
    sets_count: Optional[int] = None
    reps_count: Optional[int] = None
    weight_kg: Optional[Decimal] = None
    sort_order: Optional[int] = None

    @field_validator("sets_count")
    @classmethod
    def sets_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 100):
            raise ValueError("sets_count must be between 1 and 100")
        return v

    @field_validator("reps_count")
    @classmethod
    def reps_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 1000):
            raise ValueError("reps_count must be between 1 and 1000")
        return v

    @field_validator("weight_kg")
    @classmethod
    def weight_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("weight_kg must be >= 0")
        return v


class WorkoutSetCreate(BaseModel):
    set_number: int
    reps_count: int
    weight_kg: Decimal = Decimal("0")

    @field_validator("set_number")
    @classmethod
    def set_number_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("set_number must be >= 1")
        return v

    @field_validator("reps_count")
    @classmethod
    def reps_range(cls, v: int) -> int:
        if not (1 <= v <= 1000):
            raise ValueError("reps_count must be between 1 and 1000")
        return v

    @field_validator("weight_kg")
    @classmethod
    def weight_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("weight_kg must be >= 0")
        return v


class WorkoutSetUpdate(BaseModel):
    reps_count: Optional[int] = None
    weight_kg: Optional[Decimal] = None
    is_completed: Optional[bool] = None

    @field_validator("reps_count")
    @classmethod
    def reps_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 1000):
            raise ValueError("reps_count must be between 1 and 1000")
        return v

    @field_validator("weight_kg")
    @classmethod
    def weight_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("weight_kg must be >= 0")
        return v


class WorkoutSetResponse(BaseModel):
    id: uuid.UUID
    workout_exercise_id: uuid.UUID
    set_number: int
    reps_count: int
    weight_kg: Decimal
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkoutExerciseResponse(BaseModel):
    id: uuid.UUID
    workout_id: uuid.UUID
    exercise_id: uuid.UUID
    exercise_name: str
    sort_order: int
    sets_count: int
    reps_count: int
    weight_kg: Decimal
    sets: list[WorkoutSetResponse] = []

    model_config = {"from_attributes": True}


class WorkoutCreate(BaseModel):
    workout_type_id: int
    workout_date: date
    duration_minutes: int

    @field_validator("duration_minutes")
    @classmethod
    def duration_range(cls, v: int) -> int:
        if not (1 <= v <= 1440):
            raise ValueError("duration_minutes must be between 1 and 1440")
        return v


class WorkoutUpdate(BaseModel):
    workout_type_id: Optional[int] = None
    workout_date: Optional[date] = None
    duration_minutes: Optional[int] = None

    @field_validator("duration_minutes")
    @classmethod
    def duration_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 1440):
            raise ValueError("duration_minutes must be between 1 and 1440")
        return v


class WorkoutResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    workout_type_id: int
    workout_type_name: str
    workout_date: date
    duration_minutes: int
    exercises: list[WorkoutExerciseResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkoutListResponse(BaseModel):
    items: list[WorkoutResponse]
    total: int
    page: int
    size: int
