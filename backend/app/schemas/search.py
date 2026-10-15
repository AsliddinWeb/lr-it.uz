from pydantic import BaseModel


class SearchResultItem(BaseModel):
    id: str
    title: str
    subtitle: str | None = None
    url: str


class SearchResults(BaseModel):
    courses: list[SearchResultItem] = []
    students: list[SearchResultItem] = []
    enrollments: list[SearchResultItem] = []
