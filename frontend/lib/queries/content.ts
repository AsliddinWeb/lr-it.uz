import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { SiteContentItem } from "@/lib/types";

export function useSiteContent() {
  return useQuery({
    queryKey: ["content"],
    queryFn: () => apiFetch<SiteContentItem[]>("/content"),
    staleTime: 60_000,
  });
}

export function useAdminSiteContent() {
  return useQuery({
    queryKey: ["admin", "content"],
    queryFn: () => apiFetch<SiteContentItem[]>("/admin/content"),
  });
}

export function contentValue(items: SiteContentItem[] | undefined, key: string, fallback: string) {
  return items?.find((item) => item.key === key)?.content ?? fallback;
}
