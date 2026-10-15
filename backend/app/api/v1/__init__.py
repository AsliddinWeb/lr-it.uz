from fastapi import APIRouter

from app.api.v1.admin_analytics import router as admin_analytics_router
from app.api.v1.admin_broadcast import router as admin_broadcast_router
from app.api.v1.admin_certificates import router as admin_certificates_router
from app.api.v1.admin_quizzes import router as admin_quizzes_router
from app.api.v1.ai import router as ai_router
from app.api.v1.auth import router as auth_router
from app.api.v1.author_analytics import router as author_analytics_router
from app.api.v1.certificates import router as certificates_router
from app.api.v1.code import router as code_router
from app.api.v1.content import router as content_router
from app.api.v1.courses import router as courses_router
from app.api.v1.enrollments import router as enrollments_router
from app.api.v1.gamification import router as gamification_router
from app.api.v1.lessons import router as lessons_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.public_stats import router as public_stats_router
from app.api.v1.qa import router as qa_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.search import router as search_router
from app.api.v1.users import router as users_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(courses_router)
api_router.include_router(enrollments_router)
api_router.include_router(lessons_router)
api_router.include_router(code_router)
api_router.include_router(quizzes_router)
api_router.include_router(gamification_router)
api_router.include_router(ai_router)
api_router.include_router(certificates_router)
api_router.include_router(admin_analytics_router)
api_router.include_router(qa_router)
api_router.include_router(search_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_broadcast_router)
api_router.include_router(content_router)
api_router.include_router(admin_certificates_router)
api_router.include_router(admin_quizzes_router)
api_router.include_router(author_analytics_router)
api_router.include_router(public_stats_router)
