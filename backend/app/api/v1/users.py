import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserListResponse, UserPublic, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    q: str | None = None,
    role: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> UserListResponse:
    query = select(User)

    if q:
        pattern = f"%{q}%"
        query = query.where(or_(User.full_name.ilike(pattern), User.email.ilike(pattern)))
    if role:
        query = query.where(User.role == role)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))

    query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    result = await db.scalars(query)
    return UserListResponse(items=list(result.all()), total=total or 0)


@router.patch("/{user_id}/role", response_model=UserPublic)
async def update_user_role(
    user_id: uuid.UUID,
    data: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}/block", response_model=UserPublic)
async def toggle_user_block(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="O'zingizni bloklay olmaysiz"
        )

    user.is_blocked = not user.is_blocked
    await db.commit()
    await db.refresh(user)
    return user
