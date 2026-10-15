import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import LEADERBOARD_PREFIX, cached_json
from app.core.deps import require_role
from app.db.session import get_db
from app.models.enrollment import Enrollment
from app.models.gamification import UserBadge, XpLog
from app.models.user import User
from app.schemas.gamification import BadgePublic, LeaderboardEntry, XpLogEntry

router = APIRouter(tags=["gamification"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    course_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    return await cached_json(
        f"{LEADERBOARD_PREFIX}{course_id or 'all'}", 60, lambda: _compute_leaderboard(course_id, db)
    )


async def _compute_leaderboard(course_id: uuid.UUID | None, db: AsyncSession) -> list[dict]:
    query = select(User).where(User.role == "student")

    if course_id is not None:
        query = query.where(
            User.id.in_(
                select(Enrollment.student_id).where(
                    Enrollment.course_id == course_id, Enrollment.status == "tasdiqlangan"
                )
            )
        )

    query = query.order_by(User.xp_total.desc()).limit(100)
    result = await db.scalars(query)
    users = list(result.all())

    return [
        LeaderboardEntry(
            rank=i + 1, user_id=u.id, full_name=u.full_name, xp_total=u.xp_total
        ).model_dump(mode="json")
        for i, u in enumerate(users)
    ]


@router.get("/users/me/xp-history", response_model=list[XpLogEntry])
async def xp_history(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> list[XpLog]:
    result = await db.scalars(
        select(XpLog).where(XpLog.user_id == user.id).order_by(XpLog.created_at.desc())
    )
    return list(result.all())


@router.get("/users/me/badges", response_model=list[BadgePublic])
async def my_badges(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> list[BadgePublic]:
    result = await db.scalars(
        select(UserBadge)
        .where(UserBadge.user_id == user.id)
        .options(selectinload(UserBadge.badge))
        .order_by(UserBadge.earned_at.desc())
    )
    return [
        BadgePublic(
            id=ub.badge.id,
            title=ub.badge.title,
            description=ub.badge.description,
            icon_key=ub.badge.icon_key,
            earned_at=ub.earned_at,
        )
        for ub in result.all()
    ]
