import uuid

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import COURSE_LIST_PREFIX, invalidate
from app.core.config import settings
from app.core.deps import get_current_user
from app.core.email import send_email
from app.core.redis_client import (
    consume_reset_token,
    consume_telegram_link_token,
    store_email_otp,
    store_reset_token,
    store_telegram_link_token,
    verify_email_otp,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
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
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserCreate,
    UserLogin,
    UserPublic,
    UserSelfUpdate,
    VerifyEmailRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_IS_PROD = settings.ENVIRONMENT == "production"


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


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    existing = await db.scalar(select(User).where(User.email == data.email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu email allaqachon ro'yxatdan o'tgan",
        )

    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="student",
        is_email_verified=False,
    )
    db.add(user)
    await db.commit()

    code = generate_otp()
    await store_email_otp(user.email, code)
    await send_email(
        user.email,
        "EdTech — emailni tasdiqlash",
        f"Tasdiqlash kodingiz: {code}. Kod 10 daqiqa amal qiladi.",
    )

    return {"message": "Ro'yxatdan o'tish muvaffaqiyatli. Tasdiqlash kodi emailga yuborildi."}


@router.post("/verify-email")
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    if not await verify_email_otp(data.email, data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tasdiqlash kodi noto'g'ri yoki eskirgan",
        )

    user = await db.scalar(select(User).where(User.email == data.email))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    user.is_email_verified = True
    await db.commit()

    return {"message": "Email muvaffaqiyatli tasdiqlandi. Endi tizimga kirishingiz mumkin."}


@router.post("/login", response_model=UserPublic)
async def login(
    data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)
) -> User:
    user = await db.scalar(select(User).where(User.email == data.email))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Email yoki parol noto'g'ri"
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email tasdiqlanmagan. Avval tasdiqlash kodini kiriting.",
        )

    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hisobingiz bloklangan. Administratorga murojaat qiling.",
        )

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

    _set_auth_cookies(response, user)
    return {"message": "Sessiya yangilandi"}


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Tizimdan chiqdingiz"}


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    user = await db.scalar(select(User).where(User.email == data.email))
    if user is not None:
        token = generate_reset_token()
        await store_reset_token(token, user.email)
        await send_email(
            user.email,
            "EdTech — parolni tiklash",
            f"Parolni tiklash kodi: {token}. Kod 30 daqiqa amal qiladi.",
        )

    return {
        "message": "Agar bunday email tizimda mavjud bo'lsa, parolni tiklash havolasi yuborildi."
    }


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    email = await consume_reset_token(data.token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Havola noto'g'ri yoki eskirgan"
        )

    user = await db.scalar(select(User).where(User.email == email))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    user.password_hash = hash_password(data.new_password)
    await db.commit()

    return {"message": "Parol muvaffaqiyatli yangilandi"}


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
