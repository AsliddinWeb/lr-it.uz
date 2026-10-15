import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class QaQuestionCreate(BaseModel):
    question_text: str = Field(min_length=3, max_length=1000)


class QaAnswerCreate(BaseModel):
    answer_text: str = Field(min_length=1, max_length=2000)


class QaUserBrief(BaseModel):
    id: uuid.UUID
    full_name: str
    role: str

    model_config = {"from_attributes": True}


class QaAnswerDetail(BaseModel):
    id: uuid.UUID
    answer_text: str
    is_hidden: bool
    created_at: datetime
    user: QaUserBrief

    model_config = {"from_attributes": True}


class QaQuestionDetail(BaseModel):
    id: uuid.UUID
    question_text: str
    created_at: datetime
    student: QaUserBrief
    answers: list[QaAnswerDetail]

    model_config = {"from_attributes": True}
