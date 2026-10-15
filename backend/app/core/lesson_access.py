import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import Course, Lesson, Module
from app.models.enrollment import Enrollment
from app.models.user import User

_ACCESS_DENIED = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Bu mavzuni ko'rish uchun kursga tasdiqlangan so'rovingiz bo'lishi kerak",
)


async def get_lesson_with_access(lesson_id: uuid.UUID, user: User, db: AsyncSession) -> Lesson:
    lesson = await db.scalar(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(
            selectinload(Lesson.module)
            .selectinload(Module.course)
            .selectinload(Course.authors),
            selectinload(Lesson.resources),
        )
    )
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mavzu topilmadi")

    course = lesson.module.course

    if user.role == "admin":
        return lesson

    if user.role == "author":
        if course.author_id == user.id or any(author.id == user.id for author in course.authors):
            return lesson
        raise _ACCESS_DENIED

    if user.role == "student":
        enrollment = await db.scalar(
            select(Enrollment).where(
                Enrollment.student_id == user.id,
                Enrollment.course_id == course.id,
                Enrollment.status == "tasdiqlangan",
            )
        )
        if enrollment is not None:
            return lesson

    raise _ACCESS_DENIED
