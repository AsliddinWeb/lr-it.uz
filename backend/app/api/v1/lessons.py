import io
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import storage
from app.core.certificates import mark_lesson_complete
from app.core.deps import assert_course_access, get_current_user, require_role
from app.core.lesson_access import get_lesson_with_access
from app.db.session import get_db
from app.models.course import Course, Lesson, Module
from app.models.lesson_progress import LessonProgress
from app.models.lesson_resource import LessonResource
from app.models.user import User
from app.schemas.lesson import LessonDetail, LessonResourceOut

router = APIRouter(tags=["lessons"])


@router.get("/lessons/{lesson_id}", response_model=LessonDetail)
async def get_lesson(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LessonDetail:
    lesson = await get_lesson_with_access(lesson_id, user, db)

    is_completed = False
    if user.role == "student":
        progress = await db.scalar(
            select(LessonProgress).where(
                LessonProgress.student_id == user.id, LessonProgress.lesson_id == lesson.id
            )
        )
        is_completed = progress is not None

    return LessonDetail(
        id=lesson.id,
        title=lesson.title,
        content_md=lesson.content_md,
        video_url=lesson.video_url,
        starter_code=lesson.starter_code,
        language=lesson.language,
        order_index=lesson.order_index,
        is_completed=is_completed,
        resources=[LessonResourceOut.model_validate(r) for r in lesson.resources],
    )


@router.post("/lessons/{lesson_id}/complete")
async def complete_lesson(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> dict[str, str]:
    await get_lesson_with_access(lesson_id, user, db)
    await mark_lesson_complete(db, user.id, lesson_id)
    await db.commit()
    return {"message": "Mavzu tugallandi deb belgilandi"}


async def _get_lesson_with_course_or_404(lesson_id: uuid.UUID, db: AsyncSession) -> Lesson:
    lesson = await db.scalar(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(selectinload(Lesson.module).selectinload(Module.course).selectinload(Course.authors))
    )
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mavzu topilmadi")
    return lesson


@router.post(
    "/lessons/{lesson_id}/resources",
    status_code=status.HTTP_201_CREATED,
    response_model=LessonResourceOut,
)
async def upload_lesson_resource(
    lesson_id: uuid.UUID,
    title: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> LessonResource:
    lesson = await _get_lesson_with_course_or_404(lesson_id, db)
    assert_course_access(lesson.module.course, user)

    data = await file.read()
    safe_name = Path(file.filename or "fayl").name or "fayl"
    object_key = f"lessons/{lesson_id}/{uuid.uuid4()}-{safe_name}"
    content_type = file.content_type or "application/octet-stream"
    await storage.upload_bytes(object_key, data, content_type)

    resource = LessonResource(
        lesson_id=lesson_id,
        title=title,
        object_key=object_key,
        content_type=content_type,
        size_bytes=len(data),
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


@router.delete("/lesson-resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson_resource(
    resource_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> None:
    resource = await db.scalar(
        select(LessonResource)
        .where(LessonResource.id == resource_id)
        .options(
            selectinload(LessonResource.lesson)
            .selectinload(Lesson.module)
            .selectinload(Module.course)
            .selectinload(Course.authors)
        )
    )
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resurs topilmadi")

    assert_course_access(resource.lesson.module.course, user)

    await db.delete(resource)
    await db.commit()


@router.get("/lesson-resources/{resource_id}/download")
async def download_lesson_resource(
    resource_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StreamingResponse:
    resource = await db.scalar(select(LessonResource).where(LessonResource.id == resource_id))
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resurs topilmadi")

    await get_lesson_with_access(resource.lesson_id, user, db)

    try:
        data = await storage.download_bytes(resource.object_key)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fayl serverda topilmadi")
    return StreamingResponse(
        io.BytesIO(data),
        media_type=resource.content_type,
        headers={"Content-Disposition": f'attachment; filename="{resource.title}"'},
    )
