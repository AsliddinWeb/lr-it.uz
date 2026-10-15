import uuid

from pydantic import BaseModel, Field


class AdminQuizListItem(BaseModel):
    id: uuid.UUID
    title: str
    course_title: str
    lesson_title: str
    question_count: int


class AdminQuizQuestionDetail(BaseModel):
    id: uuid.UUID
    question_text: str
    options: list[str]
    correct_option: int
    ai_generated: bool

    model_config = {"from_attributes": True}


class AdminQuizDetail(BaseModel):
    id: uuid.UUID
    title: str
    course_title: str
    lesson_title: str
    questions: list[AdminQuizQuestionDetail]


class QuizTitleUpdate(BaseModel):
    title: str = Field(min_length=3, max_length=200)


class QuizQuestionUpdate(BaseModel):
    question_text: str = Field(min_length=3, max_length=500)
    options: list[str] = Field(min_length=2, max_length=6)
    correct_option: int = Field(ge=0)
