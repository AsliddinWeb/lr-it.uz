import uuid
from datetime import datetime

from pydantic import BaseModel


class AdminCertificateStudentBrief(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str


class AdminCertificateCourseBrief(BaseModel):
    id: uuid.UUID
    title: str


class AdminCertificateDetail(BaseModel):
    id: uuid.UUID
    certificate_number: str
    issued_at: datetime
    student: AdminCertificateStudentBrief
    course: AdminCertificateCourseBrief
