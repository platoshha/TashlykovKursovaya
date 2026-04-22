import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    age: Optional[int]
    height_cm: Optional[int]
    current_weight_kg: Optional[float]
    training_level: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
