import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.admin import DailyCount


class StudentRosterItem(BaseModel):
    student_id: uuid.UUID
    full_name: str
    email: str
    completed_lessons: int
    total_lessons: int
    completion_pct: float
    xp_total: int
    last_activity: datetime | None


class CourseStatsResponse(BaseModel):
    total_students: int
    completion_rate: float
    average_quiz_score: float
    activity_last_7_days: list[DailyCount]


class AuthorMessageCreate(BaseModel):
    message: str = Field(min_length=2, max_length=2000)
    student_id: uuid.UUID | None = None


class AuthorMessageResult(BaseModel):
    sent_count: int


class AuthorOverview(BaseModel):
    total_courses: int
    active_courses: int
    pending_enrollments: int
    total_students: int
    activity_last_7_days: list[DailyCount]
