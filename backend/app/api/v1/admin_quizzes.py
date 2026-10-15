import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import require_role
from app.db.session import get_db
from app.models.course import Course, Lesson, Module
from app.models.quiz import Quiz, QuizAttempt, QuizQuestion
from app.models.user import User
from app.schemas.admin_quiz import (
    AdminQuizDetail,
    AdminQuizListItem,
    AdminQuizQuestionDetail,
    QuizQuestionUpdate,
    QuizTitleUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])


async def _get_quiz_with_titles_or_404(
    quiz_id: uuid.UUID, db: AsyncSession
) -> tuple[Quiz, str, str]:
    row = (
        await db.execute(
            select(Quiz, Lesson.title, Course.title)
            .join(Lesson, Quiz.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .where(Quiz.id == quiz_id)
            .options(selectinload(Quiz.questions))
            .execution_options(populate_existing=True)
        )
    ).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz topilmadi")
    return row


@router.get("/quizzes", response_model=list[AdminQuizListItem])
async def list_quizzes(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[AdminQuizListItem]:
    rows = (
        await db.execute(
            select(Quiz, Lesson.title, Course.title, func.count(QuizQuestion.id))
            .join(Lesson, Quiz.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .outerjoin(QuizQuestion, QuizQuestion.quiz_id == Quiz.id)
            .group_by(Quiz.id, Lesson.title, Course.title)
            .order_by(Course.title, Lesson.title)
        )
    ).all()
    return [
        AdminQuizListItem(
            id=quiz.id,
            title=quiz.title,
            course_title=course_title,
            lesson_title=lesson_title,
            question_count=question_count,
        )
        for quiz, lesson_title, course_title, question_count in rows
    ]


@router.get("/quizzes/{quiz_id}", response_model=AdminQuizDetail)
async def get_quiz_detail(
    quiz_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> AdminQuizDetail:
    quiz, lesson_title, course_title = await _get_quiz_with_titles_or_404(quiz_id, db)
    return AdminQuizDetail(
        id=quiz.id,
        title=quiz.title,
        course_title=course_title,
        lesson_title=lesson_title,
        questions=[AdminQuizQuestionDetail.model_validate(q) for q in quiz.questions],
    )


@router.patch("/quizzes/{quiz_id}", response_model=AdminQuizDetail)
async def update_quiz_title(
    quiz_id: uuid.UUID,
    data: QuizTitleUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> AdminQuizDetail:
    quiz, _lesson_title, _course_title = await _get_quiz_with_titles_or_404(quiz_id, db)
    quiz.title = data.title
    await db.commit()
    return await get_quiz_detail(quiz_id, db, _)


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> None:
    quiz, _lesson_title, _course_title = await _get_quiz_with_titles_or_404(quiz_id, db)

    attempt_count = await db.scalar(
        select(func.count()).select_from(QuizAttempt).where(QuizAttempt.quiz_id == quiz_id)
    )
    if attempt_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu quiz bo'yicha javoblar mavjud, o'chirib bo'lmaydi",
        )

    await db.delete(quiz)
    await db.commit()


@router.patch("/quiz-questions/{question_id}", response_model=AdminQuizQuestionDetail)
async def update_quiz_question(
    question_id: uuid.UUID,
    data: QuizQuestionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> QuizQuestion:
    question = await db.get(QuizQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi")

    question.question_text = data.question_text
    question.options = data.options
    question.correct_option = data.correct_option
    await db.commit()
    await db.refresh(question)
    return question


@router.delete("/quiz-questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> None:
    question = await db.get(QuizQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi")

    remaining = await db.scalar(
        select(func.count()).select_from(QuizQuestion).where(QuizQuestion.quiz_id == question.quiz_id)
    )
    if remaining is not None and remaining <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quizda kamida bitta savol qolishi kerak",
        )

    await db.delete(question)
    await db.commit()
