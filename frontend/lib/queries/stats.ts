import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { PublicStats } from "@/lib/types";

export function useHomeStats() {
  return useQuery({
    queryKey: ["stats", "public"],
    queryFn: () => apiFetch<PublicStats>("/stats"),
    staleTime: 60_000,
  });
}
