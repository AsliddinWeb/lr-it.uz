import uuid

from pydantic import BaseModel, Field


class QuizQuestionCreate(BaseModel):
    question_text: str = Field(min_length=3, max_length=500)
    options: list[str] = Field(min_length=2, max_length=6)
    correct_option: int = Field(ge=0)


class QuizCreate(BaseModel):
    lesson_id: uuid.UUID
    title: str = Field(min_length=3, max_length=200)
    questions: list[QuizQuestionCreate] = Field(min_length=1)


class QuizQuestionPublic(BaseModel):
    id: uuid.UUID
    question_text: str
    options: list[str]

    model_config = {"from_attributes": True}


class QuizPublic(BaseModel):
    id: uuid.UUID
    title: str
    questions: list[QuizQuestionPublic]

    model_config = {"from_attributes": True}


class QuizAttemptSubmit(BaseModel):
    answers: dict[uuid.UUID, int]


class QuizAttemptResult(BaseModel):
    score: int
    total: int
    xp_awarded: int
    correct_question_ids: list[uuid.UUID]
