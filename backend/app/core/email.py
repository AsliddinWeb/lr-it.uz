import asyncio
import html
import logging
from email.message import EmailMessage

import aiosmtplib
import httpx

from app.core.config import settings

logger = logging.getLogger("edtech.email")

_SMTP_TIMEOUT_SECONDS = 15


class EmailDeliveryError(Exception):
    """Email yuborib bo'lmadi (SMTP sozlanmagan yoki server rad etdi)."""


# Implicit TLS (SSL) portlari; qolgan portlarda server qo'llasa, STARTTLS avtomatik yoqiladi.
_IMPLICIT_TLS_PORTS = {465, 2465}


def email_enabled() -> bool:
    return bool(settings.RESEND_API_KEY or settings.SMTP_HOST)


def email_transport() -> str:
    """Hozir qaysi usul ishlatilishi: 'resend-api' | 'smtp' | 'none'."""
    if settings.RESEND_API_KEY:
        return "resend-api"
    return "smtp" if settings.SMTP_HOST else "none"


async def _send_via_resend(to: str, subject: str, body: str, html_body: str | None) -> None:
    payload: dict = {"from": settings.SMTP_FROM, "to": [to], "subject": subject, "text": body}
    if html_body:
        payload["html"] = html_body
    try:
        async with httpx.AsyncClient(timeout=_SMTP_TIMEOUT_SECONDS) as client:
            response = await client.post(
                settings.RESEND_API_URL,
                json=payload,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            )
    except httpx.HTTPError as exc:
        logger.error("Resend API bilan bog'lanib bo'lmadi (to=%s): %s", to, exc)
        raise EmailDeliveryError(f"Resend API bilan bog'lanib bo'lmadi: {exc}") from exc

    if response.status_code >= 400:
        try:
            reason = response.json().get("message") or response.text
        except ValueError:
            reason = response.text
        logger.error("Resend API xatosi (to=%s): %s %s", to, response.status_code, reason)
        raise EmailDeliveryError(f"Resend API {response.status_code}: {reason}")


async def send_email(to: str, subject: str, body: str, html_body: str | None = None) -> None:
    """Email yuboradi. Yuborib bo'lmasa `EmailDeliveryError` ko'taradi — jimgina o'tkazib yubormaydi."""
    if not email_enabled():
        raise EmailDeliveryError("Email yuborish sozlanmagan (RESEND_API_KEY ham, SMTP_HOST ham bo'sh)")
    if settings.RESEND_API_KEY:
        await _send_via_resend(to, subject, body, html_body)
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    implicit_tls = settings.SMTP_PORT in _IMPLICIT_TLS_PORTS
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            use_tls=implicit_tls,
            # 587 va 25-portlarda server qo'llab-quvvatlasa, STARTTLS avtomatik yoqiladi.
            start_tls=None,
            timeout=_SMTP_TIMEOUT_SECONDS,
        )
    except (aiosmtplib.SMTPException, OSError, asyncio.TimeoutError) as exc:
        logger.error("Email yuborilmadi (to=%s, host=%s:%s): %s", to, settings.SMTP_HOST, settings.SMTP_PORT, exc)
        raise EmailDeliveryError(str(exc)) from exc


def render_code_email(*, purpose: str, code: str, minutes: int) -> tuple[str, str, str]:
    """(mavzu, oddiy matn, HTML) — tasdiqlash va parolni tiklash kodlari uchun."""
    if purpose == "reset":
        subject = "EdTech: parolni tiklash kodi"
        lead = "Parolni tiklash uchun quyidagi koddan foydalaning."
    else:
        subject = "EdTech: emailni tasdiqlash kodi"
        lead = "Ro'yxatdan o'tishni yakunlash uchun quyidagi koddan foydalaning."

    text = (
        f"{lead}\n\nKod: {code}\n\nKod {minutes} daqiqa amal qiladi. "
        "Agar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring."
    )
    safe_code = html.escape(code)
    html_body = f"""\
<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#131522">
  <p style="font-size:18px;font-weight:700;margin:0 0 16px">EdTech</p>
  <p style="margin:0 0 16px;line-height:1.5">{html.escape(lead)}</p>
  <p style="margin:0 0 16px;padding:16px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;background:#EEF0FD;color:#4338CA;border-radius:12px">{safe_code}</p>
  <p style="margin:0;color:#6B7085;font-size:13px;line-height:1.5">Kod {minutes} daqiqa amal qiladi. Agar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring.</p>
</div>"""
    return subject, text, html_body
