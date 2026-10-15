import uuid

from pydantic import BaseModel


class LessonResourceOut(BaseModel):
    id: uuid.UUID
    title: str
    content_type: str
    size_bytes: int

    model_config = {"from_attributes": True}


class LessonDetail(BaseModel):
    id: uuid.UUID
    title: str
    content_md: str
    video_url: str | None
    starter_code: str | None
    language: str | None
    order_index: int
    is_completed: bool = False
    resources: list[LessonResourceOut] = []

    model_config = {"from_attributes": True}
