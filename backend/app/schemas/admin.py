from pydantic import BaseModel


class DailyCount(BaseModel):
    date: str
    count: int


class AnalyticsOverview(BaseModel):
    total_students: int
    total_authors: int
    total_admins: int
    total_courses: int
    active_courses: int
    total_enrollments: int
    pending_enrollments: int
    signups_last_30_days: list[DailyCount]
    activity_last_7_days: list[DailyCount]
    completion_rate: float
