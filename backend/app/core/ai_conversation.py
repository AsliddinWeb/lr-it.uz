import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_conversation import AiConversation


async def get_or_create_conversation(
    db: AsyncSession, user_id: uuid.UUID, lesson_id: uuid.UUID
) -> AiConversation:
    conversation = await db.scalar(
        select(AiConversation).where(
            AiConversation.user_id == user_id, AiConversation.lesson_id == lesson_id
        )
    )
    if conversation is None:
        conversation = AiConversation(user_id=user_id, lesson_id=lesson_id, messages=[])
        db.add(conversation)
        await db.flush()
    return conversation


def append_message(conversation: AiConversation, role: str, content: str) -> None:
    conversation.messages = [
        *conversation.messages,
        {
            "role": role,
            "content": content,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    ]
