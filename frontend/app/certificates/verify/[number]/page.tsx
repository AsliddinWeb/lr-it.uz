"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCertificateVerify } from "@/lib/queries/certificates";

export default function VerifyCertificatePage() {
  const params = useParams<{ number: string }>();
  const { data: certificate, isLoading, error } = useCertificateVerify(params.number);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 font-display text-xl font-bold text-text-primary"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            E
          </span>
          EdTech
        </Link>

        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : error || !certificate ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-text-muted">Bunday raqamli sertifikat topilmadi. Raqam to&apos;g&apos;ri kiritilganini tekshiring.</p>
          </div>
        ) : (
          <div className="rounded-2xl border-4 border-dashed border-primary bg-surface p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <BadgeCheck className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm text-text-muted">
              Ushbu sertifikat quyidagi shaxsga berilgan:
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
              {certificate.student_name}
            </h1>
            <p className="mt-4 text-sm text-text-muted">kursini muvaffaqiyatli tugatgani uchun</p>
            <p className="mt-1 font-display text-xl font-bold text-text-primary">
              {certificate.course_title}
            </p>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6 text-left text-sm text-text-muted">
              <div>
                Sertifikat raqami:{" "}
                <span className="font-medium text-text-primary">
                  {certificate.certificate_number}
                </span>
                <br />
                Berilgan sana:{" "}
                {new Date(certificate.issued_at).toLocaleDateString("uz-UZ")}
              </div>
              <Button asChild size="sm">
                <a
                  href={`/api/v1/certificates/${certificate.certificate_number}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
