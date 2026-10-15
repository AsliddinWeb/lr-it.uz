import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.certificates import mark_lesson_complete
from app.core.deps import require_role
from app.core.gamification import XP_PER_CODE_SUCCESS, award_xp, check_code_badges
from app.core.lesson_access import get_lesson_with_access
from app.core.piston import run_code
from app.db.session import get_db
from app.models.code_submission import CodeSubmission
from app.models.user import User
from app.schemas.code import CodeRunRequest, CodeRunResult, CodeSubmissionDetail

router = APIRouter(tags=["code"])


async def _execute_and_record(
    lesson_id: uuid.UUID, code: str, user: User, db: AsyncSession
) -> CodeRunResult:
    lesson = await get_lesson_with_access(lesson_id, user, db)
    if not lesson.language:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu mavzuda kod-mashq mavjud emas",
        )

    result = await run_code(lesson.language, code)

    xp_awarded = 0
    if result.status == "success":
        already_succeeded = await db.scalar(
            select(CodeSubmission).where(
                CodeSubmission.student_id == user.id,
                CodeSubmission.lesson_id == lesson.id,
                CodeSubmission.status == "success",
            )
        )
        if already_succeeded is None:
            xp_awarded = XP_PER_CODE_SUCCESS

    db.add(
        CodeSubmission(
            student_id=user.id,
            lesson_id=lesson.id,
            code=code,
            stdout=result.stdout,
            stderr=result.stderr,
            status=result.status,
            xp_awarded=xp_awarded,
        )
    )
    await db.flush()

    if xp_awarded:
        await award_xp(db, user, xp_awarded, "kod_ishga_tushdi")

    if result.status == "success":
        await check_code_badges(db, user)
        await mark_lesson_complete(db, user.id, lesson.id)

    await db.commit()

    return CodeRunResult(stdout=result.stdout, stderr=result.stderr, status=result.status)


@router.post("/code/run", response_model=CodeRunResult)
async def code_run(
    data: CodeRunRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> CodeRunResult:
    return await _execute_and_record(data.lesson_id, data.code, user, db)


@router.get("/code/submissions", response_model=list[CodeSubmissionDetail])
async def list_submissions(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> list[CodeSubmission]:
    result = await db.scalars(
        select(CodeSubmission)
        .where(CodeSubmission.student_id == user.id, CodeSubmission.lesson_id == lesson_id)
        .order_by(CodeSubmission.created_at.desc())
    )
    return list(result.all())
