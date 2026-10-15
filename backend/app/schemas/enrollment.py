import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EnrollmentCreate(BaseModel):
    course_id: uuid.UUID


class EnrollmentReject(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


class CourseBrief(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    track: str
    cover_image_url: str | None

    model_config = {"from_attributes": True}


class StudentBrief(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str

    model_config = {"from_attributes": True}


class EnrollmentDetail(BaseModel):
    id: uuid.UUID
    status: str
    rejection_reason: str | None
    requested_at: datetime
    reviewed_at: datetime | None
    course: CourseBrief
    student: StudentBrief

    model_config = {"from_attributes": True}


class EnrollmentWithProgress(EnrollmentDetail):
    completed_lessons: int
    total_lessons: int
