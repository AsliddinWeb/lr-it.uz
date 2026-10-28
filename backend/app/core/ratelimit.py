"""Oddiy Redis asosidagi tezlik cheklovi (login urinishlari uchun)."""

from fastapi import HTTPException, status
from redis.exceptions import RedisError

from app.core.redis_client import redis_client


async def ensure_below(key: str, limit: int) -> None:
    """Hisoblagich `limit` ga yetgan bo'lsa, 429 qaytaradi. Redis ishlamasa, to'sib qo'ymaydi."""
    try:
        count = await redis_client.get(f"rl:{key}")
        if count is not None and int(count) >= limit:
            ttl = max(await redis_client.ttl(f"rl:{key}"), 1)
            minutes = max(ttl // 60, 1)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Juda ko'p muvaffaqiyatsiz urinish. {minutes} daqiqadan so'ng qayta urinib ko'ring.",
            )
    except RedisError:
        return


async def record_failure(key: str, window_seconds: int) -> None:
    try:
        count = await redis_client.incr(f"rl:{key}")
        if count == 1:
            await redis_client.expire(f"rl:{key}", window_seconds)
    except RedisError:
        return


async def clear(key: str) -> None:
    try:
        await redis_client.delete(f"rl:{key}")
    except RedisError:
        return
