import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = ""
    track: str = Field(pattern="^(savodxonlik|python|cpp)$")
    level: str = Field(pattern="^(boshlangich|orta|yuqori)$")
    cover_image_url: str | None = None


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    track: str | None = Field(default=None, pattern="^(savodxonlik|python|cpp)$")
    level: str | None = Field(default=None, pattern="^(boshlangich|orta|yuqori)$")
    cover_image_url: str | None = None


class CourseStatusUpdate(BaseModel):
    status: str = Field(pattern="^(qoralama|kutilmoqda|faol|arxiv)$")


class AuthorPublic(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class CourseListItem(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    description: str
    track: str
    level: str
    status: str
    cover_image_url: str | None
    created_at: datetime
    authors: list[AuthorPublic] = []

    model_config = {"from_attributes": True}


class LessonSummary(BaseModel):
    id: uuid.UUID
    title: str
    order_index: int
    has_video: bool
    has_code: bool
    resource_count: int
    is_completed: bool = False

    model_config = {"from_attributes": True}


class ModuleSummary(BaseModel):
    id: uuid.UUID
    title: str
    order_index: int
    lessons: list[LessonSummary]

    model_config = {"from_attributes": True}


class CourseDetail(CourseListItem):
    authors: list[AuthorPublic]
    modules: list[ModuleSummary]


class ModuleCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)


class ModuleUpdate(BaseModel):
    title: str = Field(min_length=2, max_length=200)


class LessonCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    content_md: str = ""
    video_url: str | None = None
    language: str | None = Field(default=None, pattern="^(python|cpp)$")
    starter_code: str | None = None


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    content_md: str | None = None
    video_url: str | None = None
    language: str | None = Field(default=None, pattern="^(python|cpp)$")
    starter_code: str | None = None
