import secrets
import uuid

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import otp, ratelimit
from app.core.cache import COURSE_LIST_PREFIX, PUBLIC_STATS_KEY, invalidate
from app.core.config import settings
from app.core.deps import get_current_user
from app.core.email import EmailDeliveryError, email_enabled, render_code_email, send_email
from app.core.google_auth import GoogleAuthError, verify_google_credential
from app.core.redis_client import consume_telegram_link_token, store_telegram_link_token
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_reset_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.telegram import (
    TelegramLinkResponse,
    TelegramWebhookRequest,
    TelegramWebhookResponse,
)
from app.schemas.user import (
    AuthProviders,
    ForgotPasswordRequest,
    GoogleLoginRequest,
    ResendCodeRequest,
    ResetPasswordRequest,
    UserCreate,
    UserLogin,
    UserPublic,
    UserSelfUpdate,
    VerifyEmailRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_IS_PROD = settings.ENVIRONMENT == "production"

LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_FAILURES_PER_EMAIL = 10
LOGIN_MAX_FAILURES_PER_IP = 50

# Mavjud bo'lmagan email uchun ham bir xil vaqt sarflansin (hisob mavjudligini vaqtdan bilib bo'lmasin).
_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def _coded(status_code: int, code: str, message: str, **extra: object) -> HTTPException:
    """Frontend `code` bo'yicha qaror qabul qiladi, `message` foydalanuvchiga ko'rsatiladi."""
    return HTTPException(status_code=status_code, detail={"code": code, "message": message, **extra})


def _norm(email: str) -> str:
    return email.strip().lower()


async def _find_user(db: AsyncSession, email: str) -> User | None:
    return await db.scalar(select(User).where(func.lower(User.email) == _norm(email)))


def _set_auth_cookies(response: Response, user: User) -> None:
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id), user.role)

    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=_IS_PROD,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=_IS_PROD,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def _require_email_service() -> None:
    """Productionda email xizmati sozlanmagan bo'lsa, foydalanuvchini aldab qo'ymaymiz."""
    if _IS_PROD and not email_enabled():
        raise _coded(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "email_unavailable",
            "Email orqali tasdiqlash hozircha ishlamayapti. Google orqali kiring yoki administratorga murojaat qiling.",
        )


async def _reserve_or_429(purpose: str, email: str) -> None:
    try:
        await otp.reserve_send(purpose, email)
    except otp.OtpThrottled as exc:
        raise _coded(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "throttled",
            f"Kod yaqinda yuborilgan. {exc.retry_after} soniyadan so'ng qayta so'rang.",
            retry_after=exc.retry_after,
        ) from exc


async def _issue_and_send(purpose: str, email: str) -> dict[str, object]:
    """Yangi kod yaratadi va yuboradi. Natijada `resend_in` (va faqat lokal muhitda `debug_code`) qaytadi."""
    code = otp.generate_code()
    await otp.store_code(purpose, email, code)
    result: dict[str, object] = {"resend_in": otp.RESEND_COOLDOWN_SECONDS}

    if not email_enabled():
        # Faqat lokal ishlab chiqish: SMTP'siz sinash uchun kodni javobda qaytaramiz.
        result["debug_code"] = code
        return result

    subject, text, html_body = render_code_email(
        purpose=purpose, code=code, minutes=otp.OTP_TTL_SECONDS // 60
    )
    try:
        await send_email(email, subject, text, html_body)
    except EmailDeliveryError as exc:
        await otp.discard_code(purpose, email)
        raise _coded(
            status.HTTP_502_BAD_GATEWAY,
            "email_failed",
            "Kodni emailga yuborib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.",
        ) from exc
    return result


@router.get("/providers", response_model=AuthProviders)
async def providers() -> AuthProviders:
    return AuthProviders(
        google_client_id=settings.GOOGLE_CLIENT_ID or None,
        email_enabled=email_enabled() or not _IS_PROD,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    _require_email_service()
    email = _norm(data.email)

    existing = await _find_user(db, email)
    if existing is not None and (existing.is_email_verified or existing.is_blocked):
        raise _coded(
            status.HTTP_409_CONFLICT,
            "email_taken",
            "Bu email allaqachon ro'yxatdan o'tgan. Tizimga kiring yoki parolni tiklang.",
        )

    await _reserve_or_429("verify", email)

    if existing is None:
        db.add(
            User(
                full_name=data.full_name.strip(),
                email=email,
                password_hash=hash_password(data.password),
                role="student",
                is_email_verified=False,
            )
        )
    else:
        # Tasdiqlanmagan hisob: kod yo'qolgan bo'lsa, qayta ro'yxatdan o'tib davom ettirish mumkin.
        existing.full_name = data.full_name.strip()
        existing.password_hash = hash_password(data.password)
    await db.commit()

    sent = await _issue_and_send("verify", email)
    return {
        "message": "Tasdiqlash kodi emailga yuborildi.",
        "email": email,
        **sent,
    }


@router.post("/resend-code")
async def resend_code(data: ResendCodeRequest, db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    _require_email_service()
    email = _norm(data.email)
    await _reserve_or_429("verify", email)

    user = await _find_user(db, email)
    sent: dict[str, object] = {"resend_in": otp.RESEND_COOLDOWN_SECONDS}
    if user is not None and not user.is_email_verified and not user.is_blocked:
        sent = await _issue_and_send("verify", email)

    return {"message": "Agar bu email tasdiqlanmagan bo'lsa, yangi kod yuborildi.", **sent}


_CODE_ERRORS = {
    "wrong": ("code_wrong", "Kod noto'g'ri. Qayta tekshirib kiriting."),
    "locked": ("code_locked", "Urinishlar soni tugadi. Yangi kod so'rang."),
    "expired": ("code_expired", "Kod eskirgan yoki yuborilmagan. Yangi kod so'rang."),
}


def _raise_code_error(result: str) -> None:
    code, message = _CODE_ERRORS[result]
    raise _coded(status.HTTP_400_BAD_REQUEST, code, message)


@router.post("/verify-email", response_model=UserPublic)
async def verify_email(
    data: VerifyEmailRequest, response: Response, db: AsyncSession = Depends(get_db)
) -> User:
    email = _norm(data.email)
    result = await otp.verify_code("verify", email, data.code)
    if result != "ok":
        _raise_code_error(result)

    user = await _find_user(db, email)
    if user is None:
        raise _coded(status.HTTP_404_NOT_FOUND, "not_found", "Foydalanuvchi topilmadi")
    if user.is_blocked:
        raise _coded(
            status.HTTP_403_FORBIDDEN, "blocked", "Hisobingiz bloklangan. Administratorga murojaat qiling."
        )

    user.is_email_verified = True
    await db.commit()
    await db.refresh(user)
    await invalidate(PUBLIC_STATS_KEY)

    # Tasdiqlagan zahoti tizimga kiritamiz: qayta login qilish shart emas.
    _set_auth_cookies(response, user)
    return user


@router.post("/login", response_model=UserPublic)
async def login(
    data: UserLogin, request: Request, response: Response, db: AsyncSession = Depends(get_db)
) -> User:
    email = _norm(data.email)
    email_key = f"login:email:{email}"
    ip_key = f"login:ip:{request.client.host if request.client else 'unknown'}"

    await ratelimit.ensure_below(email_key, LOGIN_MAX_FAILURES_PER_EMAIL)
    await ratelimit.ensure_below(ip_key, LOGIN_MAX_FAILURES_PER_IP)

    user = await _find_user(db, email)
    password_ok = verify_password(data.password, user.password_hash if user else _DUMMY_HASH)
    if user is None or not password_ok:
        await ratelimit.record_failure(email_key, LOGIN_WINDOW_SECONDS)
        await ratelimit.record_failure(ip_key, LOGIN_WINDOW_SECONDS)
        raise _coded(status.HTTP_401_UNAUTHORIZED, "invalid_credentials", "Email yoki parol noto'g'ri")

    if not user.is_email_verified:
        raise _coded(
            status.HTTP_403_FORBIDDEN,
            "email_not_verified",
            "Email tasdiqlanmagan. Emailingizga yuborilgan kodni kiriting.",
            email=email,
        )

    if user.is_blocked:
        raise _coded(
            status.HTTP_403_FORBIDDEN, "blocked", "Hisobingiz bloklangan. Administratorga murojaat qiling."
        )

    await ratelimit.clear(email_key)
    _set_auth_cookies(response, user)
    return user


@router.post("/google", response_model=UserPublic)
async def google_login(
    data: GoogleLoginRequest, response: Response, db: AsyncSession = Depends(get_db)
) -> User:
    try:
        profile = await verify_google_credential(data.credential)
    except GoogleAuthError as exc:
        raise _coded(
            status.HTTP_401_UNAUTHORIZED,
            "google_invalid",
            "Google orqali kirib bo'lmadi. Qayta urinib ko'ring.",
        ) from exc

    if not profile.email_verified:
        raise _coded(
            status.HTTP_400_BAD_REQUEST,
            "google_email_unverified",
            "Google hisobingizdagi email tasdiqlanmagan.",
        )

    user = await db.scalar(select(User).where(User.google_sub == profile.sub))
    if user is None:
        user = await _find_user(db, profile.email)

    if user is None:
        user = User(
            full_name=profile.name or profile.email.split("@")[0],
            email=profile.email,
            # Google orqali kirgan hisobda parol yo'q: tasodifiy, hech kim bilmaydigan qiymat.
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role="student",
            is_email_verified=True,
            google_sub=profile.sub,
            avatar_url=profile.picture,
        )
        db.add(user)
        created = True
    else:
        created = False
        if user.is_blocked:
            raise _coded(
                status.HTTP_403_FORBIDDEN, "blocked", "Hisobingiz bloklangan. Administratorga murojaat qiling."
            )
        if user.google_sub and user.google_sub != profile.sub:
            raise _coded(
                status.HTTP_409_CONFLICT,
                "google_mismatch",
                "Bu email boshqa Google hisobiga ulangan.",
            )
        if not user.google_sub:
            user.google_sub = profile.sub
        if not user.is_email_verified:
            # Hisob egasi emailni Google orqali isbotladi. Tasdiqlanmagan hisobga kimdir oldindan
            # parol qo'yib qo'ygan bo'lishi mumkin — shuning uchun eski parolni bekor qilamiz.
            user.password_hash = hash_password(secrets.token_urlsafe(32))
            user.is_email_verified = True
        if not user.avatar_url and profile.picture:
            user.avatar_url = profile.picture

    await db.commit()
    await db.refresh(user)
    if created:
        await invalidate(PUBLIC_STATS_KEY)

    _set_auth_cookies(response, user)
    return user


@router.post("/refresh")
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if refresh_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessiya tugagan")

    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessiya tugagan")

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessiya tugagan")
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hisobingiz bloklangan. Administratorga murojaat qiling.",
        )

    _set_auth_cookies(response, user)
    return {"message": "Sessiya yangilandi"}


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Tizimdan chiqildi"}


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, object]:
    _require_email_service()
    email = _norm(data.email)
    await _reserve_or_429("reset", email)

    user = await _find_user(db, email)
    sent: dict[str, object] = {"resend_in": otp.RESEND_COOLDOWN_SECONDS}
    if user is not None and not user.is_blocked:
        sent = await _issue_and_send("reset", email)

    # Hisob mavjudligini oshkor qilmaslik uchun javob har doim bir xil.
    return {"message": "Agar bunday email tizimda mavjud bo'lsa, parolni tiklash kodi yuborildi.", **sent}


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    email = _norm(data.email)
    result = await otp.verify_code("reset", email, data.code)
    if result != "ok":
        _raise_code_error(result)

    user = await _find_user(db, email)
    if user is None:
        raise _coded(status.HTTP_404_NOT_FOUND, "not_found", "Foydalanuvchi topilmadi")

    user.password_hash = hash_password(data.new_password)
    # Kod emailga kelgani uchun, email ham isbotlangan hisoblanadi.
    user.is_email_verified = True
    await db.commit()
    await ratelimit.clear(f"login:email:{email}")

    return {"message": "Parol muvaffaqiyatli yangilandi. Endi yangi parol bilan kiring."}


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserPublic)
async def update_me(
    data: UserSelfUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> User:
    user.full_name = data.full_name
    await db.commit()
    await db.refresh(user)
    # Ism kurs katalogida (muallif sifatida) keshlangan bo'lishi mumkin.
    if user.role in ("author", "admin"):
        await invalidate(COURSE_LIST_PREFIX)
    return user


@router.post("/telegram/link", response_model=TelegramLinkResponse)
async def telegram_link(user: User = Depends(get_current_user)) -> TelegramLinkResponse:
    token = generate_reset_token()
    await store_telegram_link_token(token, str(user.id))
    bot_username = settings.TELEGRAM_BOT_USERNAME or "your_bot"
    return TelegramLinkResponse(
        token=token, deep_link=f"https://t.me/{bot_username}?start={token}"
    )


@router.post("/telegram/webhook", response_model=TelegramWebhookResponse)
async def telegram_webhook(
    data: TelegramWebhookRequest, db: AsyncSession = Depends(get_db)
) -> User:
    user_id = await consume_telegram_link_token(data.token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Havola noto'g'ri yoki eskirgan",
        )

    user = await db.get(User, uuid.UUID(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    user.telegram_chat_id = data.chat_id
    user.telegram_username = data.username
    await db.commit()

    return user
