import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { NotificationDetail } from "@/lib/types";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<NotificationDetail[]>("/notifications"),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return async (id: string) => {
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return async () => {
    await apiFetch("/notifications/read-all", { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };
}
