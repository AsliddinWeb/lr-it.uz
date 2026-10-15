import uuid
from datetime import datetime

from pydantic import BaseModel


class CertificateCourseBrief(BaseModel):
    id: uuid.UUID
    title: str
    slug: str


class CertificateDetail(BaseModel):
    id: uuid.UUID
    certificate_number: str
    issued_at: datetime
    course: CertificateCourseBrief


class CertificateVerifyResponse(BaseModel):
    certificate_number: str
    student_name: str
    course_title: str
    issued_at: datetime
