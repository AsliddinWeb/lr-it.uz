import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { CertificateDetail, CertificateVerifyResponse } from "@/lib/types";

export function useMyCertificates() {
  return useQuery({
    queryKey: ["certificates", "me"],
    queryFn: () => apiFetch<CertificateDetail[]>("/certificates/me"),
  });
}

export function useCertificateVerify(number: string) {
  return useQuery({
    queryKey: ["certificate-verify", number],
    queryFn: () => apiFetch<CertificateVerifyResponse>(`/certificates/verify/${number}`),
    enabled: Boolean(number),
    retry: false,
  });
}
