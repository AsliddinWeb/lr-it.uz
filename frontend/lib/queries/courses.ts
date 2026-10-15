import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type {
  CourseDetail,
  CourseLevel,
  CourseListItem,
  CourseStatus,
  CourseTrack,
} from "@/lib/types";

export interface CourseFilters {
  track?: CourseTrack;
  level?: CourseLevel;
  mine?: boolean;
  status?: CourseStatus;
}

function buildQuery(filters: CourseFilters): string {
  const params = new URLSearchParams();
  if (filters.track) params.set("track", filters.track);
  if (filters.level) params.set("level", filters.level);
  if (filters.mine) params.set("mine", "true");
  if (filters.status) params.set("status_filter", filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: () => apiFetch<CourseListItem[]>(`/courses${buildQuery(filters)}`),
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: () => apiFetch<CourseDetail>(`/courses/${slug}`),
    enabled: Boolean(slug),
  });
}
