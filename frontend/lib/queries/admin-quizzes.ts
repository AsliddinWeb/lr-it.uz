import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AdminQuizDetail, AdminQuizListItem } from "@/lib/types";

export function useAdminQuizzes() {
  return useQuery({
    queryKey: ["admin", "quizzes"],
    queryFn: () => apiFetch<AdminQuizListItem[]>("/admin/quizzes"),
  });
}

export function useAdminQuizDetail(quizId: string | null) {
  return useQuery({
    queryKey: ["admin", "quizzes", quizId],
    queryFn: () => apiFetch<AdminQuizDetail>(`/admin/quizzes/${quizId}`),
    enabled: Boolean(quizId),
  });
}
