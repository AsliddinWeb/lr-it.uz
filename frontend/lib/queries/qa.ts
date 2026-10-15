import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { QaQuestionDetail } from "@/lib/types";

export function useLessonQuestions(lessonId: string) {
  return useQuery({
    queryKey: ["qa", "lesson", lessonId],
    queryFn: () => apiFetch<QaQuestionDetail[]>(`/lessons/${lessonId}/questions`),
    enabled: Boolean(lessonId),
  });
}

export function useAllQuestions(filters: { q?: string; unanswered?: boolean } = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.unanswered) params.set("unanswered", "true");
  const qs = params.toString();

  return useQuery({
    queryKey: ["qa", "all", filters],
    queryFn: () => apiFetch<QaQuestionDetail[]>(`/qa${qs ? `?${qs}` : ""}`),
  });
}
