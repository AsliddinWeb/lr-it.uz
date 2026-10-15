import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.deps import require_role
from app.db.session import get_db
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.user import User
from app.schemas.admin_certificate import (
    AdminCertificateCourseBrief,
    AdminCertificateDetail,
    AdminCertificateStudentBrief,
)

router = APIRouter(prefix="/admin/certificates", tags=["admin"])


@router.get("", response_model=list[AdminCertificateDetail])
async def list_certificates(
    q: str = "",
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[AdminCertificateDetail]:
    Student = aliased(User)
    query = (
        select(Certificate, Student, Course)
        .join(Student, Certificate.student_id == Student.id)
        .join(Course, Certificate.course_id == Course.id)
        .order_by(Certificate.issued_at.desc())
    )
    if q.strip():
        pattern = f"%{q}%"
        query = query.where(
            or_(Student.full_name.ilike(pattern), Student.email.ilike(pattern), Course.title.ilike(pattern))
        )

    rows = (await db.execute(query)).all()
    return [
        AdminCertificateDetail(
            id=cert.id,
            certificate_number=cert.certificate_number,
            issued_at=cert.issued_at,
            student=AdminCertificateStudentBrief(
                id=student.id, full_name=student.full_name, email=student.email
            ),
            course=AdminCertificateCourseBrief(id=course.id, title=course.title),
        )
        for cert, student, course in rows
    ]


@router.delete("/{certificate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_certificate(
    certificate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> None:
    certificate = await db.get(Certificate, certificate_id)
    if certificate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sertifikat topilmadi")

    await db.delete(certificate)
    await db.commit()
