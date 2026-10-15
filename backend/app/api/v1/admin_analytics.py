from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.analytics_utils import fill_daily_counts, grouped_counts
from app.core.deps import require_role
from app.db.session import get_db
from app.models.certificate import Certificate
from app.models.code_submission import CodeSubmission
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.quiz import QuizAttempt
from app.models.user import User
from app.schemas.admin import AnalyticsOverview

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def analytics_overview(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> AnalyticsOverview:
    now = datetime.now(timezone.utc)

    role_counts = dict(
        (await db.execute(select(User.role, func.count()).group_by(User.role))).all()
    )
    status_counts = dict(
        (await db.execute(select(Course.status, func.count()).group_by(Course.status))).all()
    )
    enrollment_status_counts = dict(
        (
            await db.execute(
                select(Enrollment.status, func.count()).group_by(Enrollment.status)
            )
        ).all()
    )

    signups_raw = await grouped_counts(db, User.created_at, now - timedelta(days=30))

    code_activity = await grouped_counts(db, CodeSubmission.created_at, now - timedelta(days=7))
    quiz_activity = await grouped_counts(db, QuizAttempt.completed_at, now - timedelta(days=7))
    activity_merged: dict[str, int] = defaultdict(int)
    for key, count in code_activity.items():
        activity_merged[key] += count
    for key, count in quiz_activity.items():
        activity_merged[key] += count

    approved_enrollments = enrollment_status_counts.get("tasdiqlangan", 0)
    certificates_count = await db.scalar(select(func.count()).select_from(Certificate))
    completion_rate = (
        round((certificates_count or 0) / approved_enrollments * 100, 1)
        if approved_enrollments
        else 0.0
    )

    return AnalyticsOverview(
        total_students=role_counts.get("student", 0),
        total_authors=role_counts.get("author", 0),
        total_admins=role_counts.get("admin", 0),
        total_courses=sum(status_counts.values()),
        active_courses=status_counts.get("faol", 0),
        total_enrollments=sum(enrollment_status_counts.values()),
        pending_enrollments=enrollment_status_counts.get("kutilmoqda", 0),
        signups_last_30_days=fill_daily_counts(signups_raw, 30),
        activity_last_7_days=fill_daily_counts(dict(activity_merged), 7),
        completion_rate=completion_rate,
    )
