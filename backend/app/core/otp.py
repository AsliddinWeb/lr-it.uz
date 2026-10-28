"""Bir martalik kodlar (email tasdiqlash, parolni tiklash): Redis'da saqlanadi.

Himoya: kod 10 daqiqa amal qiladi, noto'g'ri urinishlar soni cheklangan (6 xonali kodni
tanlab topishga yo'l qo'ymaslik uchun), qayta yuborish oralig'i va soatlik chegara bor.
"""

import hmac
import secrets

from redis.exceptions import RedisError

from app.core.redis_client import redis_client

OTP_TTL_SECONDS = 10 * 60
RESEND_COOLDOWN_SECONDS = 60
MAX_SENDS_PER_HOUR = 5
MAX_VERIFY_ATTEMPTS = 5


class OtpThrottled(Exception):
    def __init__(self, retry_after: int) -> None:
        super().__init__(f"retry after {retry_after}s")
        self.retry_after = retry_after


def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _norm(email: str) -> str:
    return email.strip().lower()


def _code_key(purpose: str, email: str) -> str:
    return f"otp:{purpose}:{_norm(email)}"


async def reserve_send(purpose: str, email: str) -> None:
    """Yuborish huquqini band qiladi: oraliq (60 s) va soatlik chegara. Mavjud bo'lmagan emaillar uchun ham bir xil ishlaydi."""
    email = _norm(email)
    cooldown_key = f"otp-cd:{purpose}:{email}"
    count_key = f"otp-cnt:{purpose}:{email}"

    ttl = await redis_client.ttl(cooldown_key)
    if ttl and ttl > 0:
        raise OtpThrottled(ttl)

    count = await redis_client.incr(count_key)
    if count == 1:
        await redis_client.expire(count_key, 3600)
    if count > MAX_SENDS_PER_HOUR:
        raise OtpThrottled(max(await redis_client.ttl(count_key), 1))

    await redis_client.set(cooldown_key, "1", ex=RESEND_COOLDOWN_SECONDS)


async def store_code(purpose: str, email: str, code: str) -> None:
    key = _code_key(purpose, email)
    pipe = redis_client.pipeline()
    pipe.delete(key)
    pipe.hset(key, mapping={"code": code, "attempts": 0})
    pipe.expire(key, OTP_TTL_SECONDS)
    await pipe.execute()


async def verify_code(purpose: str, email: str, code: str) -> str:
    """'ok' | 'wrong' | 'locked' | 'expired'."""
    key = _code_key(purpose, email)
    data = await redis_client.hgetall(key)
    if not data:
        return "expired"

    attempts = int(data.get("attempts", 0))
    if attempts >= MAX_VERIFY_ATTEMPTS:
        await redis_client.delete(key)
        return "locked"

    if hmac.compare_digest(data.get("code", ""), code):
        await redis_client.delete(key)
        return "ok"

    attempts = await redis_client.hincrby(key, "attempts", 1)
    if attempts >= MAX_VERIFY_ATTEMPTS:
        await redis_client.delete(key)
        return "locked"
    return "wrong"


async def discard_code(purpose: str, email: str) -> None:
    try:
        await redis_client.delete(_code_key(purpose, email))
    except RedisError:
        pass
