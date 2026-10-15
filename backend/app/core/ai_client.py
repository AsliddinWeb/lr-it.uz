from typing import AsyncIterator

from groq import AsyncGroq

from app.core.config import settings

NOT_CONFIGURED_MESSAGE = "AI hozircha sozlanmagan. Administrator GROQ_API_KEY sozlashi kerak."

_client: AsyncGroq | None = None


def is_configured() -> bool:
    return bool(settings.GROQ_API_KEY)


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _client


def _build_messages(messages: list[dict], system_prompt: str | None) -> list[dict]:
    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)
    return full_messages


async def stream_chat(
    messages: list[dict], system_prompt: str | None = None
) -> AsyncIterator[str]:
    if not is_configured():
        yield NOT_CONFIGURED_MESSAGE
        return

    stream = await _get_client().chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=_build_messages(messages, system_prompt),
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def complete(messages: list[dict], system_prompt: str | None = None) -> str:
    if not is_configured():
        return NOT_CONFIGURED_MESSAGE

    response = await _get_client().chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=_build_messages(messages, system_prompt),
        stream=False,
    )
    return response.choices[0].message.content or ""
