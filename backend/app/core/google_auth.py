"""Google ID token (Sign in with Google) ni tekshirish.

Frontend Google'dan `credential` (JWT) oladi; biz uni Google'ning ochiq kalitlari bilan
tekshiramiz: imzo, auditoriya (bizning Client ID), emitent va muddat. Yangi kutubxona kerak emas.
"""

import time
from dataclasses import dataclass

import httpx
from jose import JWTError, jwt

from app.core.config import settings

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
_VALID_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}
_DEFAULT_CACHE_SECONDS = 3600

_keys_cache: dict = {"keys": [], "expires_at": 0.0}


class GoogleAuthError(Exception):
    """Token yaroqsiz yoki Google bilan bog'lanib bo'lmadi."""


@dataclass
class GoogleProfile:
    sub: str
    email: str
    email_verified: bool
    name: str
    picture: str | None


async def _fetch_keys() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(GOOGLE_CERTS_URL)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise GoogleAuthError("Google kalitlarini olib bo'lmadi") from exc

    max_age = _DEFAULT_CACHE_SECONDS
    for part in response.headers.get("cache-control", "").split(","):
        part = part.strip()
        if part.startswith("max-age="):
            try:
                max_age = int(part.removeprefix("max-age="))
            except ValueError:
                pass
    keys = response.json().get("keys", [])
    _keys_cache.update(keys=keys, expires_at=time.time() + max_age)
    return keys


async def _get_key(kid: str) -> dict:
    keys = _keys_cache["keys"] if time.time() < _keys_cache["expires_at"] else await _fetch_keys()
    for key in keys:
        if key.get("kid") == kid:
            return key
    # Google kalitlarni almashtirgan bo'lishi mumkin: bir marta yangilab ko'ramiz.
    for key in await _fetch_keys():
        if key.get("kid") == kid:
            return key
    raise GoogleAuthError("Token kaliti topilmadi")


async def verify_google_credential(credential: str) -> GoogleProfile:
    if not settings.GOOGLE_CLIENT_ID:
        raise GoogleAuthError("Google bilan kirish sozlanmagan")

    try:
        kid = jwt.get_unverified_header(credential).get("kid", "")
    except JWTError as exc:
        raise GoogleAuthError("Token noto'g'ri formatda") from exc

    key = await _get_key(kid)
    try:
        claims = jwt.decode(
            credential,
            key,
            algorithms=["RS256"],
            audience=settings.GOOGLE_CLIENT_ID,
            options={"verify_iss": False, "verify_at_hash": False, "leeway": 10},
        )
    except JWTError as exc:
        raise GoogleAuthError("Token yaroqsiz yoki muddati tugagan") from exc

    if claims.get("iss") not in _VALID_ISSUERS:
        raise GoogleAuthError("Token emitenti noto'g'ri")

    email = claims.get("email")
    if not claims.get("sub") or not email:
        raise GoogleAuthError("Tokenda email yo'q")

    return GoogleProfile(
        sub=str(claims["sub"]),
        email=str(email).strip().lower(),
        email_verified=claims.get("email_verified") in (True, "true"),
        name=str(claims.get("name") or "").strip(),
        picture=claims.get("picture"),
    )
