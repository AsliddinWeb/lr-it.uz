from datetime import datetime

from pydantic import BaseModel, Field


class SiteContentItem(BaseModel):
    key: str
    content: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class SiteContentUpdate(BaseModel):
    content: str = Field(max_length=5000)
