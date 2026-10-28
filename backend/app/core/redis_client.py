from redis.asyncio import Redis, from_url

from app.core.config import settings

redis_client: Redis = from_url(settings.REDIS_URL, decode_responses=True)

TELEGRAM_LINK_TTL_SECONDS = 10 * 60


def _telegram_link_key(token: str) -> str:
    return f"telegram-link:{token}"


async def store_telegram_link_token(token: str, user_id: str) -> None:
    await redis_client.set(_telegram_link_key(token), user_id, ex=TELEGRAM_LINK_TTL_SECONDS)


async def consume_telegram_link_token(token: str) -> str | None:
    user_id = await redis_client.get(_telegram_link_key(token))
    if user_id is None:
        return None
    await redis_client.delete(_telegram_link_key(token))
    return user_id
