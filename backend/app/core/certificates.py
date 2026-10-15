import asyncio
import random
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import storage
from app.core.certificate_pdf import render_certificate_pdf
from app.core.notifications import notify
from app.models.certificate import Certificate
from app.models.course import Course, Lesson, Module
from app.models.lesson_progress import LessonProgress
from app.models.user import User


async def mark_lesson_complete(
    db: AsyncSession, student_id: uuid.UUID, lesson_id: uuid.UUID
) -> None:
    existing = await db.scalar(
        select(LessonProgress).where(
            LessonProgress.student_id == student_id, LessonProgress.lesson_id == lesson_id
        )
    )
    if existing is not None:
        return

    db.add(LessonProgress(student_id=student_id, lesson_id=lesson_id))
    await db.flush()

    lesson = await db.scalar(
        select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.module))
    )
    if lesson is None:
        return

    await check_and_issue_certificate(db, student_id, lesson.module.course_id)


async def _generate_unique_certificate_number(db: AsyncSession) -> str:
    year = datetime.now(timezone.utc).year
    while True:
        number = f"EDT-{year}-{random.randint(1000, 9999)}"
        existing = await db.scalar(
            select(Certificate).where(Certificate.certificate_number == number)
        )
        if existing is None:
            return number


async def check_and_issue_certificate(
    db: AsyncSession, student_id: uuid.UUID, course_id: uuid.UUID
) -> Certificate | None:
    existing = await db.scalar(
        select(Certificate).where(
            Certificate.student_id == student_id, Certificate.course_id == course_id
        )
    )
    if existing is not None:
        return existing

    lesson_ids = list(
        await db.scalars(
            select(Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .where(Module.course_id == course_id)
        )
    )
    if not lesson_ids:
        return None

    completed_count = await db.scalar(
        select(func.count())
        .select_from(LessonProgress)
        .where(
            LessonProgress.student_id == student_id,
            LessonProgress.lesson_id.in_(lesson_ids),
        )
    )
    if completed_count is None or completed_count < len(lesson_ids):
        return None

    student = await db.get(User, student_id)
    course = await db.get(Course, course_id)
    if student is None or course is None:
        return None

    certificate_number = await _generate_unique_certificate_number(db)
    issued_at = datetime.now(timezone.utc)

    pdf_bytes = await asyncio.to_thread(
        render_certificate_pdf, student.full_name, course.title, certificate_number, issued_at
    )
    object_key = f"certificates/{certificate_number}.pdf"
    await storage.upload_bytes(object_key, pdf_bytes, "application/pdf")

    certificate = Certificate(
        student_id=student_id,
        course_id=course_id,
        certificate_number=certificate_number,
        pdf_object_key=object_key,
        issued_at=issued_at,
    )
    db.add(certificate)
    await db.flush()

    await notify(
        db,
        student_id,
        "sertifikat_tayyor",
        {
            "message": f"\"{course.title}\" kursini tugatganingiz uchun sertifikat tayyor!",
            "url": "/dashboard/student/certificates",
        },
    )

    return certificate
