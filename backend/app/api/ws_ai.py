import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import ai_client
from app.core.ai_conversation import append_message, get_or_create_conversation
from app.core.lesson_access import get_lesson_with_access
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

router = APIRouter()


@router.websocket("/ws/ai/ask")
async def ws_ai_ask(websocket: WebSocket, db: AsyncSession = Depends(get_db)) -> None:
    access_token = websocket.cookies.get("access_token")
    payload = decode_token(access_token) if access_token else None
    if payload is None or payload.get("type") != "access":
        await websocket.close(code=4401)
        return

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None or user.role != "student":
        await websocket.close(code=4403)
        return

    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            try:
                lesson_id = uuid.UUID(data["lesson_id"])
                message = str(data["message"])
            except (KeyError, ValueError):
                await websocket.send_json({"error": "Noto'g'ri so'rov"})
                continue

            try:
                lesson = await get_lesson_with_access(lesson_id, user, db)
            except HTTPException as exc:
                await websocket.send_json({"error": exc.detail})
                continue

            conversation = await get_or_create_conversation(db, user.id, lesson_id)
            append_message(conversation, "user", message)
            await db.flush()

            history = [
                {"role": m["role"], "content": m["content"]} for m in conversation.messages
            ]
            system_prompt = (
                "Siz EdTech platformasidagi AI-yordamchisiz. Quyidagi mavzu bo'yicha "
                "o'quvchiga yordam berasiz. Qisqa, aniq, hurmatli ohangda, faqat o'zbek "
                f"tilida javob bering.\n\nMavzu: {lesson.title}\n\nMavzu matni:\n{lesson.content_md}"
            )

            full_response = ""
            async for chunk in ai_client.stream_chat(history, system_prompt=system_prompt):
                full_response += chunk
                await websocket.send_json({"delta": chunk})

            append_message(conversation, "assistant", full_response)
            await db.commit()

            await websocket.send_json({"done": True})
    except WebSocketDisconnect:
        pass
