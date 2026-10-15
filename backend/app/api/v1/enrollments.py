import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import assert_course_access, require_role
from app.core.notifications import notify
from app.core.telegram import send_telegram_message
from app.db.session import get_db
from app.models.course import Course, Lesson, Module, course_authors
from app.models.enrollment import Enrollment
from app.models.lesson_progress import LessonProgress
from app.models.user import User
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentDetail,
    EnrollmentReject,
    EnrollmentWithProgress,
)

router = APIRouter(tags=["enrollments"])

_LOAD_OPTIONS = (selectinload(Enrollment.course), selectinload(Enrollment.student))


async def _get_enrollment_or_404(enrollment_id: uuid.UUID, db: AsyncSession) -> Enrollment:
    enrollment = await db.scalar(
        select(Enrollment)
        .where(Enrollment.id == enrollment_id)
        .options(*_LOAD_OPTIONS, selectinload(Enrollment.course).selectinload(Course.authors))
        .execution_options(populate_existing=True)
    )
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="So'rov topilmadi")
    return enrollment


@router.post("/enrollments", status_code=status.HTTP_201_CREATED, response_model=EnrollmentDetail)
async def create_enrollment(
    data: EnrollmentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> Enrollment:
    course = await db.get(Course, data.course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")

    existing = await db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == user.id,
            Enrollment.course_id == data.course_id,
            Enrollment.status.in_(["kutilmoqda", "tasdiqlangan"]),
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Siz bu kursga allaqachon so'rov bergansiz",
        )

    enrollment = Enrollment(student_id=user.id, course_id=data.course_id)
    db.add(enrollment)
    await db.commit()

    return await _get_enrollment_or_404(enrollment.id, db)


@router.get("/enrollments/me", response_model=list[EnrollmentWithProgress])
async def list_my_enrollments(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> list[EnrollmentWithProgress]:
    result = await db.scalars(
        select(Enrollment)
        .where(Enrollment.student_id == user.id)
        .options(*_LOAD_OPTIONS)
        .order_by(Enrollment.requested_at.desc())
    )
    enrollments = list(result.all())

    course_ids = [e.course_id for e in enrollments]
    lessons_by_course: dict[uuid.UUID, list[uuid.UUID]] = {}
    if course_ids:
        lesson_rows = await db.execute(
            select(Lesson.id, Module.course_id)
            .join(Module, Lesson.module_id == Module.id)
            .where(Module.course_id.in_(course_ids))
        )
        for lesson_id, course_id in lesson_rows.all():
            lessons_by_course.setdefault(course_id, []).append(lesson_id)

    all_lesson_ids = [lid for ids in lessons_by_course.values() for lid in ids]
    completed_ids: set[uuid.UUID] = set()
    if all_lesson_ids:
        completed_result = await db.scalars(
            select(LessonProgress.lesson_id).where(
                LessonProgress.student_id == user.id,
                LessonProgress.lesson_id.in_(all_lesson_ids),
            )
        )
        completed_ids = set(completed_result.all())

    output = []
    for enrollment in enrollments:
        course_lesson_ids = lessons_by_course.get(enrollment.course_id, [])
        completed = sum(1 for lid in course_lesson_ids if lid in completed_ids)
        output.append(
            EnrollmentWithProgress(
                id=enrollment.id,
                status=enrollment.status,
                rejection_reason=enrollment.rejection_reason,
                requested_at=enrollment.requested_at,
                reviewed_at=enrollment.reviewed_at,
                course=enrollment.course,
                student=enrollment.student,
                completed_lessons=completed,
                total_lessons=len(course_lesson_ids),
            )
        )
    return output


@router.get("/enrollments", response_model=list[EnrollmentDetail])
async def list_enrollments(
    status_filter: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> list[Enrollment]:
    query = select(Enrollment).options(*_LOAD_OPTIONS)

    if user.role == "author":
        owned_course_ids = select(Course.id).where(
            or_(
                Course.author_id == user.id,
                Course.id.in_(
                    select(course_authors.c.course_id).where(
                        course_authors.c.user_id == user.id
                    )
                ),
            )
        )
        query = query.where(Enrollment.course_id.in_(owned_course_ids))

    if status_filter:
        query = query.where(Enrollment.status == status_filter)

    query = query.order_by(Enrollment.requested_at.desc())
    result = await db.scalars(query)
    return list(result.all())


@router.get("/enrollments/{enrollment_id}", response_model=EnrollmentDetail)
async def get_enrollment(
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Enrollment:
    enrollment = await _get_enrollment_or_404(enrollment_id, db)
    assert_course_access(enrollment.course, user)
    return enrollment


@router.patch("/enrollments/{enrollment_id}/approve", response_model=EnrollmentDetail)
async def approve_enrollment(
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Enrollment:
    enrollment = await _get_enrollment_or_404(enrollment_id, db)
    assert_course_access(enrollment.course, user)

    enrollment.status = "tasdiqlangan"
    enrollment.reviewed_by = user.id
    enrollment.reviewed_at = datetime.now(timezone.utc)

    message = f"So'rovingiz tasdiqlandi. \"{enrollment.course.title}\" kursiga dostup berildi."
    await notify(
        db,
        enrollment.student_id,
        "sorov_tasdiqlandi",
        {"message": message, "url": "/dashboard/student/enrollments"},
    )
    await db.commit()

    if enrollment.student.telegram_chat_id:
        await send_telegram_message(enrollment.student.telegram_chat_id, message)

    return await _get_enrollment_or_404(enrollment_id, db)


@router.patch("/enrollments/{enrollment_id}/reject", response_model=EnrollmentDetail)
async def reject_enrollment(
    enrollment_id: uuid.UUID,
    data: EnrollmentReject,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Enrollment:
    enrollment = await _get_enrollment_or_404(enrollment_id, db)
    assert_course_access(enrollment.course, user)

    enrollment.status = "rad_etilgan"
    enrollment.rejection_reason = data.reason
    enrollment.reviewed_by = user.id
    enrollment.reviewed_at = datetime.now(timezone.utc)

    message = f"So'rovingiz rad etildi. Sabab: {data.reason}. Qayta murojaat qilishingiz mumkin."
    await notify(
        db,
        enrollment.student_id,
        "sorov_rad_etildi",
        {"message": message, "url": "/dashboard/student/enrollments"},
    )
    await db.commit()

    if enrollment.student.telegram_chat_id:
        await send_telegram_message(enrollment.student.telegram_chat_id, message)

    return await _get_enrollment_or_404(enrollment_id, db)
