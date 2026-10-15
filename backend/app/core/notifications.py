import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def notify(db: AsyncSession, user_id: uuid.UUID, type_: str, payload: dict) -> None:
    db.add(Notification(user_id=user_id, type=type_, payload=payload))
    await db.flush()
