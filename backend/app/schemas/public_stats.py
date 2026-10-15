from pydantic import BaseModel


class PublicStats(BaseModel):
    active_courses: int
    students_count: int
    certificates_count: int
    mentors_count: int
