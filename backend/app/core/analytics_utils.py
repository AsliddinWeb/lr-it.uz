from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.admin import DailyCount


def fill_daily_counts(raw: dict[str, int], days: int) -> list[DailyCount]:
    today = datetime.now(timezone.utc).date()
    result = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        key = day.isoformat()
        result.append(DailyCount(date=key, count=raw.get(key, 0)))
    return result


async def grouped_counts(
    db: AsyncSession, column, since: datetime, *extra_filters
) -> dict[str, int]:
    query = select(func.date(column), func.count()).where(column >= since, *extra_filters)
    rows = await db.execute(query.group_by(func.date(column)))
    return {str(day): count for day, count in rows.all()}
