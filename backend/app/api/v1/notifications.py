import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationDetail

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=list[NotificationDetail])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Notification]:
    result = await db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return list(result.all())


@router.patch("/notifications/{notification_id}/read", response_model=NotificationDetail)
async def mark_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Notification:
    notification = await db.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bildirishnoma topilmadi")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


@router.patch("/notifications/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    await db.execute(
        update(Notification).where(Notification.user_id == user.id).values(is_read=True)
    )
    await db.commit()
    return {"success": True}
