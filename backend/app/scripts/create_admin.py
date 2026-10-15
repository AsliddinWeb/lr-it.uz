"""Birinchi administratorni yaratadi (yoki mavjud foydalanuvchini administratorga aylantiradi).

Ishga tushirish:
    docker compose exec backend python -m app.scripts.create_admin admin@example.uz "Ism Familiya"
Parol so'raladi (ekranda ko'rinmaydi).
"""

import asyncio
import getpass
import sys

from sqlalchemy import select

import app.models  # noqa: F401  — barcha modellar ro'yxatdan o'tishi uchun
from app.core.security import hash_password
from app.db.session import async_session_factory
from app.models.user import User


async def main(email: str, full_name: str, password: str) -> None:
    async with async_session_factory() as db:
        user = await db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                full_name=full_name,
                email=email,
                password_hash=hash_password(password),
                role="admin",
                is_email_verified=True,
            )
            db.add(user)
            action = "yaratildi"
        else:
            user.role = "admin"
            user.is_email_verified = True
            user.password_hash = hash_password(password)
            action = "administratorga aylantirildi (parol yangilandi)"
        await db.commit()
    print(f"{email} {action}.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit('Foydalanish: python -m app.scripts.create_admin EMAIL "Ism Familiya"')

    password = getpass.getpass("Parol (kamida 8 belgi): ")
    if len(password) < 8:
        sys.exit("Parol kamida 8 belgidan iborat bo'lishi kerak.")
    if password != getpass.getpass("Parolni takrorlang: "):
        sys.exit("Parollar mos kelmadi.")

    asyncio.run(main(sys.argv[1], sys.argv[2], password))
