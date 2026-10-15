import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { QuizPublic } from "@/lib/types";

export function useQuiz(lessonId: string) {
  return useQuery({
    queryKey: ["quiz", lessonId],
    queryFn: () => apiFetch<QuizPublic>(`/lessons/${lessonId}/quiz`),
    enabled: Boolean(lessonId),
    retry: false,
  });
}
