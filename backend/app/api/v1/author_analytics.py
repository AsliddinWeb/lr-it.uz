import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.analytics_utils import fill_daily_counts, grouped_counts
from app.core.deps import assert_course_access, require_role
from app.core.notifications import notify
from app.core.telegram import send_telegram_message
from app.db.session import get_db
from app.models.code_submission import CodeSubmission
from app.models.course import Course, Lesson, Module, course_authors
from app.models.enrollment import Enrollment
from app.models.lesson_progress import LessonProgress
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User
from app.schemas.author_analytics import (
    AuthorMessageCreate,
    AuthorMessageResult,
    AuthorOverview,
    CourseStatsResponse,
    StudentRosterItem,
)

router = APIRouter(prefix="/author", tags=["author"])


def _owned_course_ids(user: User):
    return select(Course.id).where(
        or_(
            Course.author_id == user.id,
            Course.id.in_(
                select(course_authors.c.course_id).where(course_authors.c.user_id == user.id)
            ),
        )
    )


async def _get_course_or_404(course_id: uuid.UUID, db: AsyncSession) -> Course:
    course = await db.scalar(
        select(Course).where(Course.id == course_id).options(selectinload(Course.authors))
    )
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    return course


async def _course_lesson_ids(course_id: uuid.UUID, db: AsyncSession) -> list[uuid.UUID]:
    return list(
        await db.scalars(
            select(Lesson.id).join(Module, Lesson.module_id == Module.id).where(Module.course_id == course_id)
        )
    )


@router.get("/overview", response_model=AuthorOverview)
async def author_overview(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> AuthorOverview:
    owned_course_ids = _owned_course_ids(user)

    total_courses = await db.scalar(
        select(func.count()).select_from(Course).where(Course.id.in_(owned_course_ids))
    )
    active_courses = await db.scalar(
        select(func.count())
        .select_from(Course)
        .where(Course.id.in_(owned_course_ids), Course.status == "faol")
    )
    pending_enrollments = await db.scalar(
        select(func.count())
        .select_from(Enrollment)
        .where(Enrollment.course_id.in_(owned_course_ids), Enrollment.status == "kutilmoqda")
    )
    total_students = await db.scalar(
        select(func.count(func.distinct(Enrollment.student_id))).where(
            Enrollment.course_id.in_(owned_course_ids), Enrollment.status == "tasdiqlangan"
        )
    )

    lesson_ids = list(
        await db.scalars(
            select(Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .where(Module.course_id.in_(owned_course_ids))
        )
    )

    merged_activity: dict[str, int] = {}
    if lesson_ids:
        now = datetime.now(timezone.utc)
        code_activity = await grouped_counts(
            db, CodeSubmission.created_at, now - timedelta(days=7), CodeSubmission.lesson_id.in_(lesson_ids)
        )
        quiz_ids = list(await db.scalars(select(Quiz.id).where(Quiz.lesson_id.in_(lesson_ids))))
        quiz_activity: dict[str, int] = {}
        if quiz_ids:
            quiz_activity = await grouped_counts(
                db, QuizAttempt.completed_at, now - timedelta(days=7), QuizAttempt.quiz_id.in_(quiz_ids)
            )
        for key, count in code_activity.items():
            merged_activity[key] = merged_activity.get(key, 0) + count
        for key, count in quiz_activity.items():
            merged_activity[key] = merged_activity.get(key, 0) + count

    return AuthorOverview(
        total_courses=total_courses or 0,
        active_courses=active_courses or 0,
        pending_enrollments=pending_enrollments or 0,
        total_students=total_students or 0,
        activity_last_7_days=fill_daily_counts(merged_activity, 7),
    )


@router.get("/courses/{course_id}/students", response_model=list[StudentRosterItem])
async def list_students(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> list[StudentRosterItem]:
    course = await _get_course_or_404(course_id, db)
    assert_course_access(course, user)

    lesson_ids = await _course_lesson_ids(course_id, db)
    total_lessons = len(lesson_ids)

    enrollments = (
        await db.execute(
            select(Enrollment, User)
            .join(User, Enrollment.student_id == User.id)
            .where(Enrollment.course_id == course_id, Enrollment.status == "tasdiqlangan")
            .order_by(User.full_name)
        )
    ).all()

    completed_counts: dict[uuid.UUID, int] = {}
    progress_last: dict[uuid.UUID, datetime] = {}
    code_last: dict[uuid.UUID, datetime] = {}
    quiz_last: dict[uuid.UUID, datetime] = {}

    if lesson_ids:
        completed_counts = dict(
            (
                await db.execute(
                    select(LessonProgress.student_id, func.count())
                    .where(LessonProgress.lesson_id.in_(lesson_ids))
                    .group_by(LessonProgress.student_id)
                )
            ).all()
        )
        progress_last = dict(
            (
                await db.execute(
                    select(LessonProgress.student_id, func.max(LessonProgress.completed_at))
                    .where(LessonProgress.lesson_id.in_(lesson_ids))
                    .group_by(LessonProgress.student_id)
                )
            ).all()
        )
        code_last = dict(
            (
                await db.execute(
                    select(CodeSubmission.student_id, func.max(CodeSubmission.created_at))
                    .where(CodeSubmission.lesson_id.in_(lesson_ids))
                    .group_by(CodeSubmission.student_id)
                )
            ).all()
        )
        quiz_ids = list(await db.scalars(select(Quiz.id).where(Quiz.lesson_id.in_(lesson_ids))))
        if quiz_ids:
            quiz_last = dict(
                (
                    await db.execute(
                        select(QuizAttempt.student_id, func.max(QuizAttempt.completed_at))
                        .where(QuizAttempt.quiz_id.in_(quiz_ids))
                        .group_by(QuizAttempt.student_id)
                    )
                ).all()
            )

    roster = []
    for enrollment, student in enrollments:
        completed = completed_counts.get(student.id, 0)
        candidates = [
            t
            for t in (progress_last.get(student.id), code_last.get(student.id), quiz_last.get(student.id))
            if t is not None
        ]
        roster.append(
            StudentRosterItem(
                student_id=student.id,
                full_name=student.full_name,
                email=student.email,
                completed_lessons=completed,
                total_lessons=total_lessons,
                completion_pct=round(completed / total_lessons * 100, 1) if total_lessons else 0.0,
                xp_total=student.xp_total,
                last_activity=max(candidates) if candidates else None,
            )
        )
    return roster


@router.get("/courses/{course_id}/stats", response_model=CourseStatsResponse)
async def course_stats(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> CourseStatsResponse:
    course = await _get_course_or_404(course_id, db)
    assert_course_access(course, user)

    lesson_ids = await _course_lesson_ids(course_id, db)
    total_lessons = len(lesson_ids)

    approved_students = list(
        await db.scalars(
            select(Enrollment.student_id).where(
                Enrollment.course_id == course_id, Enrollment.status == "tasdiqlangan"
            )
        )
    )
    total_students = len(approved_students)

    completed_students = 0
    average_quiz_score = 0.0
    now = datetime.now(timezone.utc)
    code_activity: dict[str, int] = {}
    quiz_activity: dict[str, int] = {}

    if lesson_ids and total_students:
        completed_counts = dict(
            (
                await db.execute(
                    select(LessonProgress.student_id, func.count())
                    .where(
                        LessonProgress.lesson_id.in_(lesson_ids),
                        LessonProgress.student_id.in_(approved_students),
                    )
                    .group_by(LessonProgress.student_id)
                )
            ).all()
        )
        completed_students = sum(
            1 for count in completed_counts.values() if count >= total_lessons
        )

        code_activity = await grouped_counts(
            db, CodeSubmission.created_at, now - timedelta(days=7), CodeSubmission.lesson_id.in_(lesson_ids)
        )

    if lesson_ids:
        quiz_ids = list(await db.scalars(select(Quiz.id).where(Quiz.lesson_id.in_(lesson_ids))))
        if quiz_ids:
            average_quiz_score = (
                await db.scalar(
                    select(func.avg(QuizAttempt.score)).where(QuizAttempt.quiz_id.in_(quiz_ids))
                )
                or 0.0
            )
            quiz_activity = await grouped_counts(
                db, QuizAttempt.completed_at, now - timedelta(days=7), QuizAttempt.quiz_id.in_(quiz_ids)
            )

    merged_activity: dict[str, int] = {}
    for key, count in code_activity.items():
        merged_activity[key] = merged_activity.get(key, 0) + count
    for key, count in quiz_activity.items():
        merged_activity[key] = merged_activity.get(key, 0) + count

    return CourseStatsResponse(
        total_students=total_students,
        completion_rate=round(completed_students / total_students * 100, 1) if total_students else 0.0,
        average_quiz_score=round(float(average_quiz_score), 1),
        activity_last_7_days=fill_daily_counts(merged_activity, 7),
    )


@router.post("/courses/{course_id}/message", response_model=AuthorMessageResult)
async def send_message(
    course_id: uuid.UUID,
    data: AuthorMessageCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> AuthorMessageResult:
    course = await _get_course_or_404(course_id, db)
    assert_course_access(course, user)

    query = select(Enrollment.student_id).where(
        Enrollment.course_id == course_id, Enrollment.status == "tasdiqlangan"
    )
    if data.student_id is not None:
        query = query.where(Enrollment.student_id == data.student_id)

    target_ids = list(await db.scalars(query))
    if data.student_id is not None and not target_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="O'quvchi bu kursga yozilmagan"
        )

    students = list(await db.scalars(select(User).where(User.id.in_(target_ids)))) if target_ids else []

    for student in students:
        await notify(
            db,
            student.id,
            "muallif_xabari",
            {"message": data.message, "course_title": course.title, "author_name": user.full_name},
        )
        if student.telegram_chat_id:
            await send_telegram_message(
                student.telegram_chat_id, f"{user.full_name} ({course.title}):\n{data.message}"
            )

    await db.commit()
    return AuthorMessageResult(sent_count=len(students))
