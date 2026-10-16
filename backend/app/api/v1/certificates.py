import io

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.deps import require_role
from app.db.session import get_db
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.user import User
from app.schemas.certificate import (
    CertificateCourseBrief,
    CertificateDetail,
    CertificateVerifyResponse,
)

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("/me", response_model=list[CertificateDetail])
async def my_certificates(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
) -> list[CertificateDetail]:
    result = await db.scalars(select(Certificate).where(Certificate.student_id == user.id))
    certificates = list(result.all())

    course_ids = [c.course_id for c in certificates]
    courses = {}
    if course_ids:
        course_rows = await db.scalars(select(Course).where(Course.id.in_(course_ids)))
        courses = {c.id: c for c in course_rows.all()}

    return [
        CertificateDetail(
            id=cert.id,
            certificate_number=cert.certificate_number,
            issued_at=cert.issued_at,
            course=CertificateCourseBrief(
                id=courses[cert.course_id].id,
                title=courses[cert.course_id].title,
                slug=courses[cert.course_id].slug,
            ),
        )
        for cert in certificates
        if cert.course_id in courses
    ]


@router.get("/verify/{number}", response_model=CertificateVerifyResponse)
async def verify_certificate(number: str, db: AsyncSession = Depends(get_db)) -> CertificateVerifyResponse:
    certificate = await db.scalar(select(Certificate).where(Certificate.certificate_number == number))
    if certificate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday sertifikat topilmadi")

    student = await db.get(User, certificate.student_id)
    course = await db.get(Course, certificate.course_id)
    if student is None or course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday sertifikat topilmadi")

    return CertificateVerifyResponse(
        certificate_number=certificate.certificate_number,
        student_name=student.full_name,
        course_title=course.title,
        issued_at=certificate.issued_at,
    )


@router.get("/{number}/pdf")
async def download_certificate_pdf(number: str, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    certificate = await db.scalar(select(Certificate).where(Certificate.certificate_number == number))
    if certificate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday sertifikat topilmadi")

    try:
        pdf_bytes = await storage.download_bytes(certificate.pdf_object_key)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sertifikat fayli serverda topilmadi")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{number}.pdf"'},
    )
