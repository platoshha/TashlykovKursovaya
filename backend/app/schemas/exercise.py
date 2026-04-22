import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class ExerciseCategoryResponse(BaseModel):
    id: int
    code: str
    name: str

    model_config = {"from_attributes": True}


class ExerciseCreate(BaseModel):
    name: str
    category_id: Optional[int] = None
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name must not be empty")
        return v


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name must not be empty")
        return v


class ExerciseResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    category_id: Optional[int]
    category_name: Optional[str]
    is_system: bool
    created_by_user_id: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class ExerciseListResponse(BaseModel):
    items: list[ExerciseResponse]
    total: int
