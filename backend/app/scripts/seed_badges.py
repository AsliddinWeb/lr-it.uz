import asyncio

from sqlalchemy import select

from app.core.gamification import BADGE_ACTIVE_LEARNER, BADGE_FIRST_STEP, BADGE_QUIZ_MASTER
from app.db.session import async_session_factory
from app.models.gamification import Badge

BADGES = [
    (BADGE_FIRST_STEP, "Birinchi marta kodni muvaffaqiyatli ishga tushirdingiz.", "Footprints"),
    (BADGE_QUIZ_MASTER, "Biror quizni 100% ball bilan tugatdingiz.", "Trophy"),
    (BADGE_ACTIVE_LEARNER, "5 marta kod ishga tushirdingiz.", "Flame"),
]


async def seed() -> None:
    async with async_session_factory() as db:
        for title, description, icon_key in BADGES:
            existing = await db.scalar(select(Badge).where(Badge.title == title))
            if existing is None:
                db.add(Badge(title=title, description=description, icon_key=icon_key))
        await db.commit()
    print("Badge'lar urug'landi.")


if __name__ == "__main__":
    asyncio.run(seed())
