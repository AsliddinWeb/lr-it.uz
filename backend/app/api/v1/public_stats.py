from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import PUBLIC_STATS_KEY, cached_json
from app.db.session import get_db
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.user import User
from app.schemas.public_stats import PublicStats

router = APIRouter(tags=["stats"])


@router.get("/stats", response_model=PublicStats)
async def public_stats(db: AsyncSession = Depends(get_db)) -> PublicStats:
    data = await cached_json(PUBLIC_STATS_KEY, 5 * 60, lambda: _compute_stats(db))
    return PublicStats(**data)


async def _compute_stats(db: AsyncSession) -> dict[str, int]:
    active_courses = await db.scalar(
        select(func.count()).select_from(Course).where(Course.status == "faol")
    )
    students_count = await db.scalar(
        select(func.count()).select_from(User).where(User.role == "student")
    )
    certificates_count = await db.scalar(select(func.count()).select_from(Certificate))
    mentors_count = await db.scalar(
        select(func.count()).select_from(User).where(User.role == "author")
    )

    return PublicStats(
        active_courses=active_courses or 0,
        students_count=students_count or 0,
        certificates_count=certificates_count or 0,
        mentors_count=mentors_count or 0,
    ).model_dump()
