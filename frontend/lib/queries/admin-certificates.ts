import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AdminCertificateDetail } from "@/lib/types";

export function useAdminCertificates(q: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return useQuery({
    queryKey: ["admin", "certificates", q],
    queryFn: () => apiFetch<AdminCertificateDetail[]>(`/admin/certificates${qs}`),
  });
}
