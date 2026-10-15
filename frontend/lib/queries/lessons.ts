import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { LessonDetail } from "@/lib/types";

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => apiFetch<LessonDetail>(`/lessons/${lessonId}`),
    enabled: Boolean(lessonId),
    retry: false,
  });
}
