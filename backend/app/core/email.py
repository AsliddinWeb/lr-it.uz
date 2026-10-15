import logging

import aiosmtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("edtech.email")


async def send_email(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        logger.warning(
            "SMTP sozlanmagan (SMTP_HOST bo'sh) — email yuborilmadi. To: %s, Mavzu: %s, Matn: %s",
            to,
            subject,
            body,
        )
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER or None,
        password=settings.SMTP_PASSWORD or None,
        start_tls=True,
    )
