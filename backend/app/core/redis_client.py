from redis.asyncio import Redis, from_url

from app.core.config import settings

redis_client: Redis = from_url(settings.REDIS_URL, decode_responses=True)

OTP_TTL_SECONDS = 10 * 60
RESET_TOKEN_TTL_SECONDS = 30 * 60
TELEGRAM_LINK_TTL_SECONDS = 10 * 60


def _otp_key(email: str) -> str:
    return f"otp:verify-email:{email}"


def _reset_key(token: str) -> str:
    return f"otp:reset-password:{token}"


async def store_email_otp(email: str, code: str) -> None:
    await redis_client.set(_otp_key(email), code, ex=OTP_TTL_SECONDS)


async def verify_email_otp(email: str, code: str) -> bool:
    stored = await redis_client.get(_otp_key(email))
    if stored is None or stored != code:
        return False
    await redis_client.delete(_otp_key(email))
    return True


async def store_reset_token(token: str, email: str) -> None:
    await redis_client.set(_reset_key(token), email, ex=RESET_TOKEN_TTL_SECONDS)


async def consume_reset_token(token: str) -> str | None:
    email = await redis_client.get(_reset_key(token))
    if email is None:
        return None
    await redis_client.delete(_reset_key(token))
    return email


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
