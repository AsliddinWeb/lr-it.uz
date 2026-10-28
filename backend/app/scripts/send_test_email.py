"""SMTP sozlamalarini tekshiradi: berilgan manzilga sinov xati yuboradi va natijani aniq ko'rsatadi.

Ishga tushirish:
    docker compose exec backend python -m app.scripts.send_test_email siz@gmail.com
"""

import asyncio
import sys

from app.core.config import settings
from app.core.email import EmailDeliveryError, email_enabled, render_code_email, send_email


async def main(to: str) -> int:
    if not email_enabled():
        print("XATO: SMTP_HOST bo'sh. .env faylida SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM ni to'ldiring,")
        print("      keyin `docker compose up -d --force-recreate backend` qiling.")
        return 1

    print(f"SMTP: {settings.SMTP_HOST}:{settings.SMTP_PORT}, foydalanuvchi: {settings.SMTP_USER or '(yo`q)'}, From: {settings.SMTP_FROM}")
    subject, text, html_body = render_code_email(purpose="verify", code="123456", minutes=10)
    try:
        await send_email(to, f"[SINOV] {subject}", text, html_body)
    except EmailDeliveryError as exc:
        print(f"XATO: xat yuborilmadi: {exc}")
        print("Odatiy sabablar: parol noto'g'ri (Gmail uchun oddiy parol emas, 'App password' kerak), port yopiq,")
        print("SMTP_FROM manzili provayderda tasdiqlanmagan, yoki server chiqish (outbound) 25/465/587 portlarini bloklagan.")
        return 1

    print(f"OK: sinov xati {to} manziliga yuborildi. Kiruvchi xatlar va Spam papkasini tekshiring.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Foydalanish: python -m app.scripts.send_test_email siz@gmail.com")
    sys.exit(asyncio.run(main(sys.argv[1])))
