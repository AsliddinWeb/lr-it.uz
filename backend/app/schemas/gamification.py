import uuid
from datetime import datetime

from pydantic import BaseModel


class XpLogEntry(BaseModel):
    id: uuid.UUID
    amount: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BadgePublic(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    icon_key: str
    earned_at: datetime


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: uuid.UUID
    full_name: str
    xp_total: int
