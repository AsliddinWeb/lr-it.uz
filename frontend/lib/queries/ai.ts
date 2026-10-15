import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AiMessage } from "@/lib/types";

export function useConversationHistory(lessonId: string) {
  return useQuery({
    queryKey: ["ai-conversation", lessonId],
    queryFn: () => apiFetch<{ messages: AiMessage[] }>(`/ai/conversations/${lessonId}`),
    enabled: Boolean(lessonId),
  });
}
