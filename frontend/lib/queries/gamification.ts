import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { BadgePublic, LeaderboardEntry, XpLogEntry } from "@/lib/types";

export function useLeaderboard(courseId?: string) {
  return useQuery({
    queryKey: ["leaderboard", courseId],
    queryFn: () =>
      apiFetch<LeaderboardEntry[]>(
        `/leaderboard${courseId ? `?course_id=${courseId}` : ""}`
      ),
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: ["badges", "me"],
    queryFn: () => apiFetch<BadgePublic[]>("/users/me/badges"),
  });
}

export function useMyXpHistory() {
  return useQuery({
    queryKey: ["xp-history", "me"],
    queryFn: () => apiFetch<XpLogEntry[]>("/users/me/xp-history"),
  });
}
