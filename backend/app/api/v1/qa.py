import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, require_role
from app.core.lesson_access import get_lesson_with_access
from app.db.session import get_db
from app.models.qa import QaAnswer, QaQuestion
from app.models.user import User
from app.schemas.qa import QaAnswerCreate, QaQuestionCreate, QaQuestionDetail

router = APIRouter(tags=["qa"])

_LOAD_OPTIONS = (selectinload(QaQuestion.student), selectinload(QaQuestion.answers).selectinload(QaAnswer.user))


@router.get("/lessons/{lesson_id}/questions", response_model=list[QaQuestionDetail])
async def list_questions(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[QaQuestion]:
    await get_lesson_with_access(lesson_id, user, db)

    result = await db.scalars(
        select(QaQuestion)
        .where(QaQuestion.lesson_id == lesson_id)
        .options(*_LOAD_OPTIONS)
        .order_by(QaQuestion.created_at.desc())
    )
    return list(result.all())


@router.post(
    "/lessons/{lesson_id}/questions", status_code=status.HTTP_201_CREATED, response_model=QaQuestionDetail
)
async def create_question(
    lesson_id: uuid.UUID,
    data: QaQuestionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> QaQuestion:
    await get_lesson_with_access(lesson_id, user, db)

    question = QaQuestion(lesson_id=lesson_id, student_id=user.id, question_text=data.question_text)
    db.add(question)
    await db.commit()

    return await db.scalar(
        select(QaQuestion).where(QaQuestion.id == question.id).options(*_LOAD_OPTIONS)
    )


@router.post(
    "/questions/{question_id}/answers", status_code=status.HTTP_201_CREATED, response_model=QaQuestionDetail
)
async def create_answer(
    question_id: uuid.UUID,
    data: QaAnswerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> QaQuestion:
    question = await db.get(QaQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi")

    await get_lesson_with_access(question.lesson_id, user, db)

    db.add(QaAnswer(question_id=question_id, user_id=user.id, answer_text=data.answer_text))
    await db.commit()

    return await db.scalar(
        select(QaQuestion).where(QaQuestion.id == question_id).options(*_LOAD_OPTIONS)
    )


@router.get("/qa", response_model=list[QaQuestionDetail])
async def list_all_questions(
    q: str | None = None,
    unanswered: bool = False,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[QaQuestion]:
    query = select(QaQuestion).options(*_LOAD_OPTIONS)

    if q:
        pattern = f"%{q}%"
        query = query.where(QaQuestion.question_text.ilike(pattern))
    if unanswered:
        query = query.where(~QaQuestion.answers.any())

    result = await db.scalars(query.order_by(QaQuestion.created_at.desc()))
    return list(result.all())


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> None:
    question = await db.scalar(
        select(QaQuestion).where(QaQuestion.id == question_id).options(*_LOAD_OPTIONS)
    )
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi")

    await db.delete(question)
    await db.commit()


@router.patch("/qa/{answer_id}/moderate", response_model=QaQuestionDetail)
async def moderate_answer(
    answer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> QaQuestion:
    answer = await db.get(QaAnswer, answer_id)
    if answer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Javob topilmadi")

    answer.is_hidden = not answer.is_hidden
    await db.commit()

    return await db.scalar(
        select(QaQuestion).where(QaQuestion.id == answer.question_id).options(*_LOAD_OPTIONS)
    )
