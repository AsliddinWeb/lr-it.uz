from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.search import SearchResultItem, SearchResults

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResults)
async def search(
    q: str = "",
    scope: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SearchResults:
    results = SearchResults()
    if not q.strip():
        return results

    pattern = f"%{q}%"

    if scope in (None, "courses"):
        query = select(Course).where(Course.title.ilike(pattern)).limit(10)
        if user.role == "student":
            query = query.where(Course.status == "faol")
        elif user.role == "author":
            query = query.where(Course.author_id == user.id)
        courses = await db.scalars(query)
        results.courses = [
            SearchResultItem(
                id=str(c.id), title=c.title, subtitle=c.track, url=f"/courses/{c.slug}"
            )
            for c in courses.all()
        ]

    if scope in (None, "students") and user.role == "admin":
        students = await db.scalars(
            select(User)
            .where(
                User.role == "student",
                or_(User.full_name.ilike(pattern), User.email.ilike(pattern)),
            )
            .limit(10)
        )
        results.students = [
            SearchResultItem(
                id=str(s.id), title=s.full_name, subtitle=s.email, url="/dashboard/admin/users"
            )
            for s in students.all()
        ]

    if scope in (None, "enrollments") and user.role in ("author", "admin"):
        query = (
            select(Enrollment)
            .join(User, Enrollment.student_id == User.id)
            .join(Course, Enrollment.course_id == Course.id)
            .options(selectinload(Enrollment.student), selectinload(Enrollment.course))
            .where(or_(User.full_name.ilike(pattern), Course.title.ilike(pattern)))
        )
        if user.role == "author":
            query = query.where(Course.author_id == user.id)
        query = query.limit(10)
        enrollments = await db.scalars(query)
        results.enrollments = [
            SearchResultItem(
                id=str(e.id),
                title=f"{e.student.full_name} → {e.course.title}",
                subtitle=e.status,
                url=f"/dashboard/{user.role}/enrollments",
            )
            for e in enrollments.all()
        ]

    return results
