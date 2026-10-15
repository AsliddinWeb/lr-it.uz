from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_role
from app.core.notifications import notify
from app.core.telegram import send_telegram_message
from app.db.session import get_db
from app.models.broadcast import Broadcast
from app.models.user import User
from app.schemas.broadcast import BroadcastCreate, BroadcastHistoryItem, BroadcastResult

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/broadcast", response_model=BroadcastResult)
async def broadcast(
    data: BroadcastCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> BroadcastResult:
    query = select(User)
    if data.target != "all":
        query = query.where(User.role == data.target)
    users = list(await db.scalars(query))

    for target_user in users:
        await notify(
            db,
            target_user.id,
            "broadcast",
            {"title": data.title, "message": data.message},
        )
        if data.also_telegram and target_user.telegram_chat_id:
            await send_telegram_message(
                target_user.telegram_chat_id, f"{data.title}\n\n{data.message}"
            )

    db.add(
        Broadcast(
            title=data.title,
            message=data.message,
            target=data.target,
            sent_count=len(users),
            sender_id=admin.id,
        )
    )
    await db.commit()
    return BroadcastResult(sent_count=len(users))


@router.get("/broadcast/history", response_model=list[BroadcastHistoryItem])
async def broadcast_history(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[Broadcast]:
    result = await db.scalars(select(Broadcast).order_by(Broadcast.created_at.desc()).limit(50))
    return list(result.all())
