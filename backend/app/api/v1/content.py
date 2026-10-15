from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import SITE_CONTENT_KEY, cached_json, invalidate
from app.core.deps import require_role
from app.db.session import get_db
from app.models.site_content import SiteContent
from app.models.user import User
from app.schemas.site_content import SiteContentItem, SiteContentUpdate

router = APIRouter(tags=["content"])


@router.get("/content", response_model=list[SiteContentItem])
async def list_content(db: AsyncSession = Depends(get_db)) -> list[dict]:
    async def load() -> list[dict]:
        result = await db.scalars(select(SiteContent))
        return [SiteContentItem.model_validate(item).model_dump(mode="json") for item in result.all()]

    return await cached_json(SITE_CONTENT_KEY, 60 * 60, load)


@router.get("/admin/content", response_model=list[SiteContentItem])
async def admin_list_content(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[SiteContent]:
    result = await db.scalars(select(SiteContent).order_by(SiteContent.key))
    return list(result.all())


@router.patch("/admin/content/{key}", response_model=SiteContentItem)
async def update_content(
    key: str,
    data: SiteContentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> SiteContent:
    item = await db.get(SiteContent, key)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kalit topilmadi")

    item.content = data.content
    await db.commit()
    await db.refresh(item)
    await invalidate(SITE_CONTENT_KEY)
    return item
