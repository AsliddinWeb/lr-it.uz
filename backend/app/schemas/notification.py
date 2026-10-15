import uuid
from datetime import datetime

from pydantic import BaseModel


class NotificationDetail(BaseModel):
    id: uuid.UUID
    type: str
    payload: dict
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
