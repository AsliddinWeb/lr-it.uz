"""Redis orqali javob keshlash.

Redis ishlamay qolsa kesh jimgina chetlab o'tiladi — endpoint to'g'ridan-to'g'ri
bazadan javob qaytaradi, foydalanuvchi xatoni ko'rmaydi.
"""

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from redis.exceptions import RedisError

from app.core.redis_client import redis_client

logger = logging.getLogger(__name__)

_PREFIX = "cache:"

COURSE_LIST_PREFIX = "courses:list:"
SITE_CONTENT_KEY = "content:public"
PUBLIC_STATS_KEY = "stats:public"
LEADERBOARD_PREFIX = "leaderboard:"


async def cached_json(key: str, ttl_seconds: int, producer: Callable[[], Awaitable[Any]]) -> Any:
    """Kalit bo'yicha keshdan qaytaradi, bo'lmasa `producer`ni chaqirib natijani saqlaydi.

    `producer` JSON'ga aylantirsa bo'ladigan qiymat qaytarishi kerak.
    """
    full_key = _PREFIX + key
    try:
        cached = await redis_client.get(full_key)
        if cached is not None:
            return json.loads(cached)
    except RedisError:
        logger.warning("Redis kesh o'qilmadi: %s", full_key, exc_info=True)

    value = await producer()

    try:
        await redis_client.set(full_key, json.dumps(value), ex=ttl_seconds)
    except RedisError:
        logger.warning("Redis keshga yozilmadi: %s", full_key, exc_info=True)
    return value


async def invalidate(*keys_or_prefixes: str) -> None:
    """Berilgan kalitlarni o'chiradi; `:` bilan tugaganlari prefiks sifatida olinadi."""
    try:
        for item in keys_or_prefixes:
            if item.endswith(":"):
                async for key in redis_client.scan_iter(match=f"{_PREFIX}{item}*"):
                    await redis_client.delete(key)
            else:
                await redis_client.delete(_PREFIX + item)
    except RedisError:
        logger.warning("Redis kesh tozalanmadi: %s", keys_or_prefixes, exc_info=True)
