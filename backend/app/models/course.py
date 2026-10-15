import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Table, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

CourseTrack = Enum("savodxonlik", "python", "cpp", name="course_track")
CourseLevel = Enum("boshlangich", "orta", "yuqori", name="course_level")
CourseStatus = Enum("qoralama", "kutilmoqda", "faol", "arxiv", name="course_status")
LessonLanguage = Enum("python", "cpp", name="lesson_language")

course_authors = Table(
    "course_authors",
    Base.metadata,
    Column("course_id", UUID(as_uuid=True), ForeignKey("courses.id"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
)


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    track: Mapped[str] = mapped_column(CourseTrack, nullable=False)
    level: Mapped[str] = mapped_column(CourseLevel, nullable=False)
    status: Mapped[str] = mapped_column(
        CourseStatus, nullable=False, default="qoralama", index=True
    )
    cover_image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    authors = relationship("User", secondary=course_authors)
    modules: Mapped[list["Module"]] = relationship(
        "Module", back_populates="course", order_by="Module.order_index", cascade="all, delete-orphan"
    )


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id"), index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(
        "Lesson", back_populates="module", order_by="Lesson.order_index", cascade="all, delete-orphan"
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("modules.id"), index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    content_md: Mapped[str] = mapped_column(Text, default="")
    video_url: Mapped[str | None] = mapped_column(String, nullable=True)
    starter_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str | None] = mapped_column(LessonLanguage, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    module: Mapped["Module"] = relationship("Module", back_populates="lessons")
    resources: Mapped[list["LessonResource"]] = relationship(
        "LessonResource", back_populates="lesson", order_by="LessonResource.created_at", cascade="all, delete-orphan"
    )

    @property
    def has_video(self) -> bool:
        return self.video_url is not None

    @property
    def has_code(self) -> bool:
        return self.language is not None

    @property
    def resource_count(self) -> int:
        return len(self.resources)
