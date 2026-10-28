"""SMTP sozlamalarini tekshiradi: berilgan manzilga sinov xati yuboradi va natijani aniq ko'rsatadi.

Ishga tushirish:
    docker compose exec backend python -m app.scripts.send_test_email siz@gmail.com
"""

import asyncio
import sys

from app.core.config import settings
from app.core.email import EmailDeliveryError, email_enabled, email_transport, render_code_email, send_email


async def main(to: str) -> int:
    if not email_enabled():
        print("XATO: email yuborish sozlanmagan. .env da RESEND_API_KEY (tavsiya etiladi) yoki SMTP_HOST, SMTP_PORT,")
        print("      SMTP_USER, SMTP_PASSWORD ni to'ldiring, so'ng `docker compose up -d --force-recreate backend` qiling.")
        return 1

    if email_transport() == "resend-api":
        print(f"Usul: Resend HTTPS API, From: {settings.SMTP_FROM}")
    else:
        print(f"Usul: SMTP {settings.SMTP_HOST}:{settings.SMTP_PORT}, foydalanuvchi: {settings.SMTP_USER or '(yo`q)'}, From: {settings.SMTP_FROM}")
    subject, text, html_body = render_code_email(purpose="verify", code="123456", minutes=10)
    try:
        await send_email(to, f"[SINOV] {subject}", text, html_body)
    except EmailDeliveryError as exc:
        print(f"XATO: xat yuborilmadi: {exc}")
        print("Odatiy sabablar: SMTP_FROM domeni email xizmatida tasdiqlanmagan (Resend: Domains bo'limida Verified bo'lishi kerak),")
        print("kalit/parol noto'g'ri, yoki server SMTP portlarini bloklagan (DigitalOcean: 25/465/587). Blok bo'lsa, RESEND_API_KEY ishlating.")
        return 1

    print(f"OK: sinov xati {to} manziliga yuborildi. Kiruvchi xatlar va Spam papkasini tekshiring.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Foydalanish: python -m app.scripts.send_test_email siz@gmail.com")
    sys.exit(asyncio.run(main(sys.argv[1])))
