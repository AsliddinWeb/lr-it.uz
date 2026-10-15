import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("edtech.telegram")

_API_BASE = "https://api.telegram.org"


async def send_telegram_message(chat_id: int, text: str) -> None:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning(
            "TELEGRAM_BOT_TOKEN sozlanmagan — xabar yuborilmadi. Chat ID: %s, Matn: %s",
            chat_id,
            text,
        )
        return

    url = f"{_API_BASE}/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(url, json={"chat_id": chat_id, "text": text})
        if response.status_code != 200:
            logger.error("Telegram xabar yuborilmadi: %s", response.text)
