import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AnalyticsOverview, BroadcastHistoryItem, UserListResponse } from "@/lib/types";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => apiFetch<AnalyticsOverview>("/admin/analytics/overview"),
  });
}

export function useAdminUsers(
  filters: { q?: string; role?: string; limit?: number; offset?: number } = {}
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.role) params.set("role", filters.role);
  params.set("limit", String(filters.limit ?? 20));
  params.set("offset", String(filters.offset ?? 0));

  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => apiFetch<UserListResponse>(`/users?${params.toString()}`),
  });
}

export function useBroadcastHistory() {
  return useQuery({
    queryKey: ["admin", "broadcast", "history"],
    queryFn: () => apiFetch<BroadcastHistoryItem[]>("/admin/broadcast/history"),
  });
}
