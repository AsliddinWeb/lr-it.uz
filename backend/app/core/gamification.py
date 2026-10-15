from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.notifications import notify
from app.models.code_submission import CodeSubmission
from app.models.gamification import Badge, UserBadge, XpLog
from app.models.user import User

BADGE_FIRST_STEP = "Birinchi qadam"
BADGE_QUIZ_MASTER = "Quiz ustasi"
BADGE_ACTIVE_LEARNER = "Faol o'quvchi"

XP_PER_CODE_SUCCESS = 10
XP_PER_CORRECT_ANSWER = 5


async def award_xp(db: AsyncSession, user: User, amount: int, reason: str) -> None:
    db.add(XpLog(user_id=user.id, amount=amount, reason=reason))
    user.xp_total += amount
    await db.flush()


async def _award_badge_if_missing(db: AsyncSession, user: User, title: str) -> None:
    badge = await db.scalar(select(Badge).where(Badge.title == title))
    if badge is None:
        return

    existing = await db.scalar(
        select(UserBadge).where(UserBadge.user_id == user.id, UserBadge.badge_id == badge.id)
    )
    if existing is None:
        db.add(UserBadge(user_id=user.id, badge_id=badge.id))
        await db.flush()
        await notify(
            db, user.id, "nishon_olindi", {"message": f"Yangi yutuq qo'lga kiritdingiz: {title}"}
        )


async def check_code_badges(db: AsyncSession, user: User) -> None:
    success_count = await db.scalar(
        select(func.count())
        .select_from(CodeSubmission)
        .where(CodeSubmission.student_id == user.id, CodeSubmission.status == "success")
    )
    if success_count and success_count >= 1:
        await _award_badge_if_missing(db, user, BADGE_FIRST_STEP)

    total_count = await db.scalar(
        select(func.count())
        .select_from(CodeSubmission)
        .where(CodeSubmission.student_id == user.id)
    )
    if total_count and total_count >= 5:
        await _award_badge_if_missing(db, user, BADGE_ACTIVE_LEARNER)


async def check_quiz_badges(db: AsyncSession, user: User, score: int, total_questions: int) -> None:
    if total_questions > 0 and score == total_questions:
        await _award_badge_if_missing(db, user, BADGE_QUIZ_MASTER)
