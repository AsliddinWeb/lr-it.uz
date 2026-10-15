import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import COURSE_LIST_PREFIX, cached_json, invalidate
from app.core.deps import assert_course_access, get_current_user_optional, require_role
from app.core.slugify import slugify
from app.db.session import get_db
from app.models.course import Course, Lesson, Module, course_authors
from app.models.lesson_progress import LessonProgress
from app.models.user import User
from app.schemas.course import (
    CourseCreate,
    CourseDetail,
    CourseListItem,
    CourseStatusUpdate,
    CourseUpdate,
    LessonCreate,
    LessonUpdate,
    ModuleCreate,
    ModuleUpdate,
)

router = APIRouter(tags=["courses"])

_COURSE_LOAD_OPTIONS = (
    selectinload(Course.authors),
    selectinload(Course.modules).selectinload(Module.lessons).selectinload(Lesson.resources),
)


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


async def _get_course_or_404(course_id: uuid.UUID, db: AsyncSession) -> Course:
    course = await db.scalar(
        select(Course)
        .where(Course.id == course_id)
        .options(*_COURSE_LOAD_OPTIONS)
        .execution_options(populate_existing=True)
    )
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    return course


async def _unique_slug(title: str, db: AsyncSession) -> str:
    base = slugify(title)
    slug = base
    suffix = 2
    while await db.scalar(select(Course.id).where(Course.slug == slug)) is not None:
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


@router.get("/courses", response_model=list[CourseListItem])
async def list_courses(
    track: str | None = None,
    level: str | None = None,
    status_filter: str | None = None,
    mine: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> list[Course] | list[dict]:
    query = select(Course).options(selectinload(Course.authors))

    is_public_listing = False
    if mine and user is not None and user.role in ("author", "admin"):
        query = query.where(Course.author_id == user.id)
    elif user is not None and user.role == "admin":
        pass  # admin — barcha holatdagi kurslar (status_filter bilan qo'shimcha cheklanishi mumkin)
    else:
        query = query.where(Course.status == "faol")
        is_public_listing = True

    if status_filter:
        query = query.where(Course.status == status_filter)
    if track:
        query = query.where(Course.track == track)
    if level:
        query = query.where(Course.level == level)

    query = query.order_by(Course.created_at.desc())

    async def load() -> list[Course]:
        result = await db.scalars(query)
        return list(result.all())

    if not is_public_listing:
        return await load()

    # Ochiq katalog hamma uchun bir xil — shuning uchun keshlanadi.
    async def load_json() -> list[dict]:
        return [CourseListItem.model_validate(c).model_dump(mode="json") for c in await load()]

    cache_key = f"{COURSE_LIST_PREFIX}{track or ''}:{level or ''}:{status_filter or ''}"
    return await cached_json(cache_key, 5 * 60, load_json)


@router.get("/courses/{slug}", response_model=CourseDetail)
async def get_course(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> Course:
    identifier_column = Course.id if _is_uuid(slug) else Course.slug
    course = await db.scalar(
        select(Course).where(identifier_column == slug).options(*_COURSE_LOAD_OPTIONS)
    )
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")

    completed_ids: set[uuid.UUID] = set()
    if user is not None and user.role == "student":
        lesson_ids = [lesson.id for module in course.modules for lesson in module.lessons]
        if lesson_ids:
            result = await db.scalars(
                select(LessonProgress.lesson_id).where(
                    LessonProgress.student_id == user.id,
                    LessonProgress.lesson_id.in_(lesson_ids),
                )
            )
            completed_ids = set(result.all())

    for module in course.modules:
        for lesson in module.lessons:
            lesson.is_completed = lesson.id in completed_ids

    return course


@router.post("/courses", status_code=status.HTTP_201_CREATED, response_model=CourseDetail)
async def create_course(
    data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Course:
    slug = await _unique_slug(data.title, db)

    course = Course(
        author_id=user.id,
        title=data.title,
        slug=slug,
        description=data.description,
        track=data.track,
        level=data.level,
        cover_image_url=data.cover_image_url,
        status="qoralama",
    )
    db.add(course)
    await db.flush()
    await db.execute(insert(course_authors).values(course_id=course.id, user_id=user.id))
    await db.commit()
    await invalidate(COURSE_LIST_PREFIX)

    return await _get_course_or_404(course.id, db)


@router.patch("/courses/{course_id}", response_model=CourseDetail)
async def update_course(
    course_id: uuid.UUID,
    data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Course:
    course = await _get_course_or_404(course_id, db)
    assert_course_access(course, user)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)

    await db.commit()
    await invalidate(COURSE_LIST_PREFIX)
    return await _get_course_or_404(course_id, db)


@router.patch("/courses/{course_id}/status", response_model=CourseDetail)
async def update_course_status(
    course_id: uuid.UUID,
    data: CourseStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> Course:
    course = await _get_course_or_404(course_id, db)
    course.status = data.status
    await db.commit()
    await invalidate(COURSE_LIST_PREFIX)
    return await _get_course_or_404(course_id, db)


@router.post(
    "/courses/{course_id}/modules", status_code=status.HTTP_201_CREATED, response_model=CourseDetail
)
async def create_module(
    course_id: uuid.UUID,
    data: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Course:
    course = await _get_course_or_404(course_id, db)
    assert_course_access(course, user)

    next_order = len(course.modules)
    db.add(Module(course_id=course.id, title=data.title, order_index=next_order))
    await db.commit()

    return await _get_course_or_404(course_id, db)


async def _get_module_with_course_or_404(module_id: uuid.UUID, db: AsyncSession) -> Module:
    module = await db.scalar(
        select(Module)
        .where(Module.id == module_id)
        .options(selectinload(Module.course).selectinload(Course.authors))
    )
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modul topilmadi")
    return module


@router.patch("/modules/{module_id}", response_model=CourseDetail)
async def update_module(
    module_id: uuid.UUID,
    data: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Course:
    module = await _get_module_with_course_or_404(module_id, db)
    assert_course_access(module.course, user)

    module.title = data.title
    await db.commit()
    return await _get_course_or_404(module.course_id, db)


@router.post(
    "/modules/{module_id}/lessons", status_code=status.HTTP_201_CREATED, response_model=CourseDetail
)
async def create_lesson(
    module_id: uuid.UUID,
    data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Course:
    module = await _get_module_with_course_or_404(module_id, db)
    assert_course_access(module.course, user)

    existing = await db.scalar(select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order_index.desc()))
    next_order = (existing.order_index + 1) if existing else 0

    db.add(
        Lesson(
            module_id=module_id,
            title=data.title,
            content_md=data.content_md,
            video_url=data.video_url,
            language=data.language,
            starter_code=data.starter_code,
            order_index=next_order,
        )
    )
    await db.commit()

    return await _get_course_or_404(module.course_id, db)


@router.patch("/lessons/{lesson_id}", response_model=CourseDetail)
async def update_lesson(
    lesson_id: uuid.UUID,
    data: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Course:
    lesson = await db.get(
        Lesson,
        lesson_id,
        options=[selectinload(Lesson.module).selectinload(Module.course).selectinload(Course.authors)],
    )
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mavzu topilmadi")

    assert_course_access(lesson.module.course, user)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)

    await db.commit()
    return await _get_course_or_404(lesson.module.course_id, db)
