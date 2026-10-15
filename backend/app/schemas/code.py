import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CodeRunRequest(BaseModel):
    lesson_id: uuid.UUID
    code: str = Field(max_length=20_000)


class CodeRunResult(BaseModel):
    stdout: str
    stderr: str
    status: str


class CodeSubmissionDetail(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    code: str
    stdout: str
    stderr: str
    status: str
    xp_awarded: int
    created_at: datetime

    model_config = {"from_attributes": True}
