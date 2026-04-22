import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class GoalTypeResponse(BaseModel):
    id: int
    code: str
    name: str

    model_config = {"from_attributes": True}


class GoalCreate(BaseModel):
    goal_type_id: int
    target_value: Optional[Decimal] = None
    target_date: Optional[date] = None
    notes: Optional[str] = None


class GoalUpdate(BaseModel):
    goal_type_id: Optional[int] = None
    target_value: Optional[Decimal] = None
    target_date: Optional[date] = None
    notes: Optional[str] = None


class GoalResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    goal_type_id: int
    goal_type_name: str
    goal_type_code: str
    target_value: Optional[Decimal]
    target_date: Optional[date]
    is_achieved: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GoalListResponse(BaseModel):
    items: list[GoalResponse]
    total: int
