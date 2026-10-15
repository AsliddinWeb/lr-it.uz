import asyncio
import logging

import httpx
from aiogram import Bot, Dispatcher
from aiogram.filters import CommandObject, CommandStart
from aiogram.types import Message

from config import settings

logging.basicConfig(level=logging.INFO)

dp = Dispatcher()

_WELCOME = (
    "EdTech botiga xush kelibsiz. Akkountingizni bog'lash uchun saytda "
    "\"Telegramni bog'lash\" tugmasini bosing."
)


@dp.message(CommandStart())
async def handle_start(message: Message, command: CommandObject) -> None:
    token = command.args
    if not token:
        await message.answer(_WELCOME)
        return

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{settings.BACKEND_URL}/api/v1/auth/telegram/webhook",
                json={
                    "token": token,
                    "chat_id": message.chat.id,
                    "username": message.from_user.username if message.from_user else None,
                },
            )
    except httpx.HTTPError:
        await message.answer("Server bilan bog'lanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.")
        return

    if response.status_code == 200:
        full_name = response.json().get("full_name", "")
        await message.answer(f"Salom, {full_name}! Akkountingiz muvaffaqiyatli bog'landi.")
    else:
        await message.answer("Havola noto'g'ri yoki eskirgan. Saytdan qaytadan urinib ko'ring.")


async def main() -> None:
    if not settings.TELEGRAM_BOT_TOKEN:
        logging.warning(
            "TELEGRAM_BOT_TOKEN sozlanmagan — bot ishga tushmaydi. "
            ".env fayliga haqiqiy token qo'shilgach konteyner qayta ishga tushiriladi."
        )
        while True:
            await asyncio.sleep(3600)

    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
