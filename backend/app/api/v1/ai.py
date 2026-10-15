import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from app.core import ai_client
from app.core.ai_conversation import append_message, get_or_create_conversation
from app.core.deps import require_role
from app.core.lesson_access import get_lesson_with_access
from app.db.session import get_db
from app.models.ai_conversation import AiConversation
from app.models.user import User
from app.schemas.ai import ConversationHistory, ReviewCodeRequest, ReviewCodeResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/review-code", response_model=ReviewCodeResponse)
async def review_code(
    data: ReviewCodeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> ReviewCodeResponse:
    lesson = await get_lesson_with_access(data.lesson_id, user, db)

    prompt = (
        f"Mavzu: {lesson.title}\n\nMavzu matni:\n{lesson.content_md}\n\n"
        f"O'quvchi yozgan kod:\n```\n{data.code}\n```\n\n"
        "Kodni tahlil qiling: xatolar bo'lsa tushuntiring, yaxshilash bo'yicha qisqa maslahat bering."
    )
    explanation = await ai_client.complete(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=(
            "Siz EdTech platformasidagi AI-yordamchisiz. O'quvchilarga qisqa, aniq va "
            "hurmatli ohangda, faqat o'zbek tilida javob berasiz."
        ),
    )

    conversation = await get_or_create_conversation(db, user.id, data.lesson_id)
    append_message(conversation, "user", f"[Kod tahlili so'rovi]\n{data.code}")
    append_message(conversation, "assistant", explanation)
    await db.commit()

    return ReviewCodeResponse(explanation=explanation)


@router.get("/conversations/{lesson_id}", response_model=ConversationHistory)
async def get_conversation(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> ConversationHistory:
    await get_lesson_with_access(lesson_id, user, db)
    conversation = await db.scalar(
        select(AiConversation).where(
            AiConversation.user_id == user.id, AiConversation.lesson_id == lesson_id
        )
    )
    return ConversationHistory(messages=conversation.messages if conversation else [])
