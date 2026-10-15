"use client";

import Link from "next/link";
import { Award, Download, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { useMyCertificates } from "@/lib/queries/certificates";

export default function StudentCertificatesPage() {
  const { data: certificates, isLoading, error, refetch } = useMyCertificates();

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Sertifikatlarim</h1>
            <p className="mt-1 text-sm text-text-muted">
              Tugatgan kurslaringiz uchun berilgan sertifikatlar.
            </p>
          </div>
          {certificates && certificates.length > 0 && (
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <span className="font-display text-xl font-bold leading-none">
                {certificates.length}
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {isLoading ? (
            [1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : error ? (
            <QueryErrorState error={error} onRetry={() => refetch()} />
          ) : certificates && certificates.length > 0 ? (
            certificates.map((cert) => (
              <div
                key={cert.id}
                className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
                <div className="flex flex-col gap-3 p-5 pl-7 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Award className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold text-text-primary">
                        {cert.course.title}
                      </p>
                      <p className="text-sm text-text-muted">
                        {cert.certificate_number} ·{" "}
                        {new Date(cert.issued_at).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/certificates/verify/${cert.certificate_number}`}>
                        <ExternalLink className="h-4 w-4" />
                        Ko&apos;rish
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <a
                        href={`/api/v1/certificates/${cert.certificate_number}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                        Yuklab olish
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <Award className="h-6 w-6" />
                </span>
                <p className="text-sm text-text-muted">
                  Hali sertifikatingiz yo&apos;q. Biror kursni to&apos;liq tugating.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
