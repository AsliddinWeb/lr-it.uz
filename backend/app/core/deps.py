import uuid
from typing import TYPE_CHECKING

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

if TYPE_CHECKING:
    from app.models.course import Course


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Tizimga kirish talab qilinadi"
    )
    if access_token is None:
        raise unauthorized

    payload = decode_token(access_token)
    if payload is None or payload.get("type") != "access":
        raise unauthorized

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise unauthorized

    return user


async def get_current_user_optional(
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if access_token is None:
        return None

    payload = decode_token(access_token)
    if payload is None or payload.get("type") != "access":
        return None

    return await db.get(User, uuid.UUID(payload["sub"]))


def require_role(*roles: str):
    async def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ushbu amal uchun dostupingiz yo'q",
            )
        return user

    return dependency


def assert_course_access(course: "Course", user: User) -> None:
    if user.role == "admin":
        return
    if course.author_id == user.id or any(author.id == user.id for author in course.authors):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bu kurs uchun dostupingiz yo'q",
    )
