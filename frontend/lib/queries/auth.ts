import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

export interface AuthProviders {
  google_client_id: string | null;
  /** false bo'lsa, email orqali kod yuborib bo'lmaydi (SMTP sozlanmagan). */
  email_enabled: boolean;
}

export function useAuthProviders() {
  return useQuery({
    queryKey: ["auth", "providers"],
    queryFn: () => apiFetch<AuthProviders>("/auth/providers"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
