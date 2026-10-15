import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AuthorOverview, CourseStatsResponse, StudentRosterItem } from "@/lib/types";

export function useAuthorOverview() {
  return useQuery({
    queryKey: ["author", "overview"],
    queryFn: () => apiFetch<AuthorOverview>("/author/overview"),
  });
}

export function useCourseStudents(courseId: string) {
  return useQuery({
    queryKey: ["author", "students", courseId],
    queryFn: () => apiFetch<StudentRosterItem[]>(`/author/courses/${courseId}/students`),
    enabled: Boolean(courseId),
  });
}

export function useCourseStats(courseId: string) {
  return useQuery({
    queryKey: ["author", "stats", courseId],
    queryFn: () => apiFetch<CourseStatsResponse>(`/author/courses/${courseId}/stats`),
    enabled: Boolean(courseId),
  });
}
