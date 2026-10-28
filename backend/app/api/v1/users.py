import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.cache import COURSE_LIST_PREFIX, LEADERBOARD_PREFIX, PUBLIC_STATS_KEY, invalidate
from app.core.deps import require_role
from app.core.security import hash_password
from app.db.session import get_db
from app.models.ai_conversation import AiConversation
from app.models.broadcast import Broadcast
from app.models.certificate import Certificate
from app.models.code_submission import CodeSubmission
from app.models.course import Course, course_authors
from app.models.enrollment import Enrollment
from app.models.gamification import UserBadge, XpLog
from app.models.lesson_progress import LessonProgress
from app.models.notification import Notification
from app.models.qa import QaAnswer, QaQuestion
from app.models.quiz import QuizAttempt
from app.models.user import User
from app.schemas.user import (
    UserAdminCreate,
    UserAdminUpdate,
    UserDetail,
    UserListResponse,
    UserPublic,
    UserRoleUpdate,
    UserStats,
)

router = APIRouter(prefix="/users", tags=["users"])


def _bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


async def _get_user_or_404(user_id: uuid.UUID, db: AsyncSession) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    return user


async def _ensure_email_free(db: AsyncSession, email: str, exclude_id: uuid.UUID | None = None) -> None:
    # Katta-kichik harf farqisiz: "Admin@x.uz" va "admin@x.uz" bitta manzil hisoblanadi.
    query = select(User.id).where(func.lower(User.email) == email.lower())
    if exclude_id is not None:
        query = query.where(User.id != exclude_id)
    if await db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu email allaqachon ro'yxatdan o'tgan"
        )


async def _other_active_admins(db: AsyncSession, exclude_id: uuid.UUID) -> int:
    return (
        await db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.role == "admin", User.is_blocked.is_(False), User.id != exclude_id)
        )
        or 0
    )


async def _authored_courses_count(db: AsyncSession, user_id: uuid.UUID) -> int:
    co_authored = select(course_authors.c.course_id).where(course_authors.c.user_id == user_id)
    return (
        await db.scalar(
            select(func.count())
            .select_from(Course)
            .where(or_(Course.author_id == user_id, Course.id.in_(co_authored)))
        )
        or 0
    )


async def _count(db: AsyncSession, column, user_id: uuid.UUID) -> int:
    return await db.scalar(select(func.count()).select_from(column.class_).where(column == user_id)) or 0


async def _delete_blockers(db: AsyncSession, user: User, acting: User) -> list[str]:
    blockers: list[str] = []
    if user.id == acting.id:
        blockers.append("O'zingizni o'chira olmaysiz.")
    if user.role == "admin" and await _other_active_admins(db, user.id) == 0:
        blockers.append("Bu oxirgi faol administrator. Avval boshqa administrator tayinlang.")
    courses = await _authored_courses_count(db, user.id)
    if courses:
        blockers.append(
            f"Bu foydalanuvchi {courses} ta kursning muallifi. "
            "Avval kurslarni boshqa muallifga o'tkazing yoki kurslarni o'chiring."
        )
    return blockers


async def _stats(db: AsyncSession, user_id: uuid.UUID) -> UserStats:
    qa_questions = await _count(db, QaQuestion.student_id, user_id)
    qa_answers = await _count(db, QaAnswer.user_id, user_id)
    return UserStats(
        enrollments=await _count(db, Enrollment.student_id, user_id),
        certificates=await _count(db, Certificate.student_id, user_id),
        authored_courses=await _authored_courses_count(db, user_id),
        quiz_attempts=await _count(db, QuizAttempt.student_id, user_id),
        qa_posts=qa_questions + qa_answers,
    )


async def _invalidate_caches() -> None:
    # Ism, rol va foydalanuvchilar soni ochiq sahifalarda (reyting, katalog, statistika) ko'rinadi.
    await invalidate(LEADERBOARD_PREFIX, COURSE_LIST_PREFIX, PUBLIC_STATS_KEY)


async def _apply_update(db: AsyncSession, user: User, admin: User, fields: dict) -> User:
    """O'zgartirishlarni xavfsizlik tekshiruvlari bilan qo'llaydi (PATCH va eski rol/blok endpointlari uchun umumiy)."""
    new_role = fields.get("role")
    block = fields.get("is_blocked")

    if user.id == admin.id:
        if new_role is not None and new_role != user.role:
            raise _bad_request("O'z rolingizni o'zgartira olmaysiz.")
        if block is True:
            raise _bad_request("O'zingizni bloklay olmaysiz.")

    demoting = user.role == "admin" and new_role is not None and new_role != "admin"
    blocking = user.role == "admin" and block is True and not user.is_blocked
    if (demoting or blocking) and await _other_active_admins(db, user.id) == 0:
        raise _bad_request("Bu oxirgi faol administrator. Avval boshqa administrator tayinlang.")

    if "email" in fields:
        await _ensure_email_free(db, fields["email"], exclude_id=user.id)
        user.email = fields["email"]
    if "full_name" in fields:
        user.full_name = fields["full_name"].strip()
    if new_role is not None:
        user.role = new_role
    if block is not None:
        user.is_blocked = block
    if fields.get("is_email_verified") is not None:
        user.is_email_verified = fields["is_email_verified"]
    if fields.get("password"):
        user.password_hash = hash_password(fields["password"])

    await db.commit()
    await db.refresh(user)
    await _invalidate_caches()
    return user


@router.get("", response_model=UserListResponse)
async def list_users(
    q: str | None = None,
    role: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> UserListResponse:
    query = select(User)

    if q:
        pattern = f"%{q}%"
        query = query.where(or_(User.full_name.ilike(pattern), User.email.ilike(pattern)))
    if role:
        query = query.where(User.role == role)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))

    query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    result = await db.scalars(query)
    return UserListResponse(items=list(result.all()), total=total or 0)


@router.post("", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserAdminCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> User:
    await _ensure_email_free(db, data.email)

    user = User(
        full_name=data.full_name.strip(),
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        is_email_verified=data.is_email_verified,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await _invalidate_caches()
    return user


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> UserDetail:
    user = await _get_user_or_404(user_id, db)
    return UserDetail(
        **UserPublic.model_validate(user).model_dump(),
        stats=await _stats(db, user.id),
        delete_blockers=await _delete_blockers(db, user, admin),
    )


@router.patch("/{user_id}", response_model=UserPublic)
async def update_user(
    user_id: uuid.UUID,
    data: UserAdminUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> User:
    user = await _get_user_or_404(user_id, db)
    return await _apply_update(db, user, admin, data.model_dump(exclude_unset=True))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> None:
    user = await _get_user_or_404(user_id, db)

    blockers = await _delete_blockers(db, user, admin)
    if blockers:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=" ".join(blockers))

    try:
        uid = user.id
        certificate_keys = list(
            (await db.scalars(select(Certificate.pdf_object_key).where(Certificate.student_id == uid))).all()
        )

        # Foydalanuvchining Q&A javoblari va savollari (savol ostidagi boshqalarning javoblari ham).
        own_questions = select(QaQuestion.id).where(QaQuestion.student_id == uid)
        await db.execute(
            delete(QaAnswer).where(or_(QaAnswer.user_id == uid, QaAnswer.question_id.in_(own_questions)))
        )
        await db.execute(delete(QaQuestion).where(QaQuestion.student_id == uid))

        # Faqat shu foydalanuvchiga tegishli yozuvlar.
        for model, column in (
            (QuizAttempt, QuizAttempt.student_id),
            (Certificate, Certificate.student_id),
            (CodeSubmission, CodeSubmission.student_id),
            (Notification, Notification.user_id),
            (LessonProgress, LessonProgress.student_id),
            (Enrollment, Enrollment.student_id),
            (UserBadge, UserBadge.user_id),
            (XpLog, XpLog.user_id),
            (AiConversation, AiConversation.user_id),
        ):
            await db.execute(delete(model).where(column == uid))

        # Boshqalarning yozuvlari qoladi: ko'rib chiqqan kishi bo'sh qoladi, yuborilgan xabarlar tarixi o'chirgan administratorga o'tadi.
        await db.execute(update(Enrollment).where(Enrollment.reviewed_by == uid).values(reviewed_by=None))
        await db.execute(update(Broadcast).where(Broadcast.sender_id == uid).values(sender_id=admin.id))

        await db.execute(delete(User).where(User.id == uid))
        await db.commit()

    except IntegrityError:
        # Kutilmagan bog'liq jadval (kelajakda qo'shilgan): hech narsa yarim o'chib qolmasin.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Foydalanuvchiga bog'liq ma'lumotlar bor, uni o'chirib bo'lmadi. Buning o'rniga bloklang.",
        )

    for key in certificate_keys:
        await storage.delete(key)
    await _invalidate_caches()


# Eski, alohida endpointlar: tarkibi umumiy PATCH bilan bir xil tekshiruvlardan o'tadi.
@router.patch("/{user_id}/role", response_model=UserPublic)
async def update_user_role(
    user_id: uuid.UUID,
    data: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> User:
    user = await _get_user_or_404(user_id, db)
    return await _apply_update(db, user, admin, {"role": data.role})


@router.patch("/{user_id}/block", response_model=UserPublic)
async def toggle_user_block(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> User:
    user = await _get_user_or_404(user_id, db)
    return await _apply_update(db, user, admin, {"is_blocked": not user.is_blocked})
