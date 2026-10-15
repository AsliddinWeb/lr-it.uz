import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AiMessage(BaseModel):
    role: str
    content: str
    created_at: datetime | None = None


class ReviewCodeRequest(BaseModel):
    lesson_id: uuid.UUID
    code: str = Field(max_length=20_000)


class ReviewCodeResponse(BaseModel):
    explanation: str


class ConversationHistory(BaseModel):
    messages: list[AiMessage]


class GenerateQuizRequest(BaseModel):
    count: int = Field(default=3, ge=1, le=10)


class QuizQuestionAuthorView(BaseModel):
    id: uuid.UUID
    question_text: str
    options: list[str]
    correct_option: int
    ai_generated: bool

    model_config = {"from_attributes": True}
