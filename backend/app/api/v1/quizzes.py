import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import ai_client
from app.core.certificates import mark_lesson_complete
from app.core.deps import assert_course_access, require_role
from app.core.gamification import XP_PER_CORRECT_ANSWER, award_xp, check_quiz_badges
from app.core.lesson_access import get_lesson_with_access
from app.db.session import get_db
from app.models.course import Course, Lesson, Module
from app.models.quiz import Quiz, QuizAttempt, QuizQuestion
from app.models.user import User
from app.schemas.ai import GenerateQuizRequest, QuizQuestionAuthorView
from app.schemas.quiz import QuizAttemptResult, QuizAttemptSubmit, QuizCreate, QuizPublic

router = APIRouter(tags=["quizzes"])


@router.get("/lessons/{lesson_id}/quiz", response_model=QuizPublic)
async def get_quiz(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student", "author", "admin")),
) -> Quiz:
    await get_lesson_with_access(lesson_id, user, db)

    quiz = await db.scalar(
        select(Quiz)
        .where(Quiz.lesson_id == lesson_id)
        .options(selectinload(Quiz.questions))
    )
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu mavzuda quiz yo'q")

    return quiz


@router.post("/quizzes", status_code=status.HTTP_201_CREATED, response_model=QuizPublic)
async def create_quiz(
    data: QuizCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Quiz:
    lesson_row = await db.scalar(
        select(Lesson)
        .where(Lesson.id == data.lesson_id)
        .options(selectinload(Lesson.module).selectinload(Module.course).selectinload(Course.authors))
    )
    if lesson_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mavzu topilmadi")

    course = lesson_row.module.course
    assert_course_access(course, user)

    existing = await db.scalar(select(Quiz).where(Quiz.lesson_id == data.lesson_id))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu mavzu uchun quiz allaqachon mavjud"
        )

    quiz = Quiz(lesson_id=data.lesson_id, title=data.title)
    quiz.questions = [
        QuizQuestion(
            question_text=q.question_text,
            options=q.options,
            correct_option=q.correct_option,
        )
        for q in data.questions
    ]
    db.add(quiz)
    await db.commit()

    return await db.scalar(
        select(Quiz).where(Quiz.id == quiz.id).options(selectinload(Quiz.questions))
    )


@router.post("/quizzes/{quiz_id}/attempts", response_model=QuizAttemptResult)
async def submit_attempt(
    quiz_id: uuid.UUID,
    data: QuizAttemptSubmit,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> QuizAttemptResult:
    quiz = await db.scalar(
        select(Quiz).where(Quiz.id == quiz_id).options(selectinload(Quiz.questions))
    )
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz topilmadi")

    await get_lesson_with_access(quiz.lesson_id, user, db)

    correct_ids: list[uuid.UUID] = []
    for question in quiz.questions:
        selected = data.answers.get(question.id)
        if selected is not None and selected == question.correct_option:
            correct_ids.append(question.id)

    score = len(correct_ids)
    total = len(quiz.questions)
    xp_awarded = score * XP_PER_CORRECT_ANSWER

    db.add(
        QuizAttempt(
            student_id=user.id,
            quiz_id=quiz.id,
            score=score,
            answers={str(k): v for k, v in data.answers.items()},
        )
    )

    if xp_awarded:
        await award_xp(db, user, xp_awarded, "quiz_tugatildi")
    await check_quiz_badges(db, user, score, total)
    await mark_lesson_complete(db, user.id, quiz.lesson_id)

    await db.commit()

    return QuizAttemptResult(
        score=score, total=total, xp_awarded=xp_awarded, correct_question_ids=correct_ids
    )


@router.post("/quizzes/{quiz_id}/generate-ai", response_model=list[QuizQuestionAuthorView])
async def generate_ai_questions(
    quiz_id: uuid.UUID,
    data: GenerateQuizRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> list[QuizQuestion]:
    quiz = await db.scalar(
        select(Quiz).where(Quiz.id == quiz_id).options(selectinload(Quiz.questions))
    )
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz topilmadi")

    lesson_row = await db.scalar(
        select(Lesson)
        .where(Lesson.id == quiz.lesson_id)
        .options(selectinload(Lesson.module).selectinload(Module.course).selectinload(Course.authors))
    )
    if lesson_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mavzu topilmadi")

    assert_course_access(lesson_row.module.course, user)

    if not ai_client.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ai_client.NOT_CONFIGURED_MESSAGE,
        )

    prompt = (
        f"Quyidagi dars matni asosida {data.count} ta test savoli tuzing. "
        "Har bir savolda aniq 4 ta variant va bitta to'g'ri javob bo'lsin.\n\n"
        f"Dars matni:\n{lesson_row.content_md}\n\n"
        "Javobni FAQAT quyidagi JSON massiv formatida qaytaring, boshqa hech narsa yozmang:\n"
        '[{"question_text": "...", "options": ["...", "...", "...", "..."], "correct_option": 0}]'
    )
    raw = await ai_client.complete(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=(
            "Siz EdTech platformasi uchun test savollari yaratuvchi yordamchisiz. "
            "Faqat o'zbek tilida, faqat so'ralgan JSON formatida javob bering."
        ),
    )

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
        if not isinstance(parsed, list):
            raise ValueError("kutilgan format ro'yxat emas")
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI javobini o'qib bo'lmadi, qayta urinib ko'ring",
        )

    new_questions: list[QuizQuestion] = []
    for item in parsed:
        try:
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=str(item["question_text"]),
                options=[str(o) for o in item["options"]],
                correct_option=int(item["correct_option"]),
                ai_generated=True,
            )
        except (KeyError, TypeError, ValueError):
            continue
        db.add(question)
        new_questions.append(question)

    await db.commit()
    for question in new_questions:
        await db.refresh(question)

    return new_questions
