import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: str
    avatar_url: str | None
    is_email_verified: bool
    is_blocked: bool
    xp_total: int
    telegram_chat_id: int | None
    telegram_username: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: list[UserPublic]
    total: int


class UserRoleUpdate(BaseModel):
    role: str = Field(pattern="^(student|author|admin)$")


class UserSelfUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
