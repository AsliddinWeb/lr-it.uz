import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.code import _execute_and_record
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

router = APIRouter()


@router.websocket("/ws/code/run")
async def ws_code_run(websocket: WebSocket, db: AsyncSession = Depends(get_db)) -> None:
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
                code = data["code"]
            except (KeyError, ValueError):
                await websocket.send_json({"error": "Noto'g'ri so'rov"})
                continue

            try:
                result = await _execute_and_record(lesson_id, code, user, db)
            except HTTPException as exc:
                await websocket.send_json({"error": exc.detail})
                continue

            await websocket.send_json(result.model_dump())
    except WebSocketDisconnect:
        pass
