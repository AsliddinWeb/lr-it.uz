import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class BroadcastCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=2, max_length=2000)
    target: str = Field(pattern="^(all|student|author)$")
    also_telegram: bool = False


class BroadcastResult(BaseModel):
    sent_count: int


class BroadcastHistoryItem(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    target: str
    sent_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
