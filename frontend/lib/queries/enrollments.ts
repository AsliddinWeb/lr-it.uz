import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { EnrollmentDetail, EnrollmentStatus, EnrollmentWithProgress, UserPublic } from "@/lib/types";

export function useMyEnrollments(enabled = true) {
  return useQuery({
    queryKey: ["enrollments", "me"],
    queryFn: () => apiFetch<EnrollmentWithProgress[]>("/enrollments/me"),
    enabled,
  });
}

export function useEnrollments(status?: EnrollmentStatus) {
  return useQuery({
    queryKey: ["enrollments", "review", status],
    queryFn: () =>
      apiFetch<EnrollmentDetail[]>(
        `/enrollments${status ? `?status_filter=${status}` : ""}`
      ),
  });
}

export function useEnrollment(enrollmentId: string) {
  return useQuery({
    queryKey: ["enrollments", enrollmentId],
    queryFn: () => apiFetch<EnrollmentDetail>(`/enrollments/${enrollmentId}`),
    enabled: Boolean(enrollmentId),
  });
}

export function useCurrentUser(options: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<UserPublic>("/auth/me"),
    retry: false,
    ...options,
  });
}
