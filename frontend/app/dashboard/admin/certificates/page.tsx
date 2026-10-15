"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Award, CalendarDays, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useAdminCertificates } from "@/lib/queries/admin-certificates";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-sm text-text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCertificatesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const { data: certificates, isLoading } = useAdminCertificates(q);

  const thisMonthCount = useMemo(() => {
    if (!certificates) return 0;
    const now = new Date();
    return certificates.filter((cert) => {
      const issued = new Date(cert.issued_at);
      return issued.getFullYear() === now.getFullYear() && issued.getMonth() === now.getMonth();
    }).length;
  }, [certificates]);

  async function handleConfirmRevoke() {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await apiFetch(`/admin/certificates/${revokeTarget}`, { method: "DELETE" });
      toast.success("Sertifikat bekor qilindi");
      queryClient.invalidateQueries({ queryKey: ["admin", "certificates"] });
      setRevokeTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <main className="px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">Sertifikatlar</h2>
          <p className="text-sm text-text-muted">Berilgan barcha sertifikatlar ro&apos;yxati.</p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="O'quvchi yoki kurs bo'yicha qidirish"
          className="w-72"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard icon={Award} label="Jami sertifikatlar" value={certificates?.length ?? 0} />
        <StatCard icon={CalendarDays} label="Shu oy berilgan" value={thisMonthCount} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>O&apos;quvchi</TableHead>
                <TableHead>Kurs</TableHead>
                <TableHead>Raqam</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates?.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">
                    {cert.student.full_name}
                    <span className="block text-xs text-text-muted">{cert.student.email}</span>
                  </TableCell>
                  <TableCell className="text-text-muted">{cert.course.title}</TableCell>
                  <TableCell className="text-text-muted">{cert.certificate_number}</TableCell>
                  <TableCell className="text-text-muted">
                    {new Date(cert.issued_at).toLocaleDateString("uz-UZ")}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`/api/v1/certificates/${cert.certificate_number}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        PDF
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRevokeTarget(cert.id)}
                    >
                      Bekor qilish
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {certificates?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-text-muted">
                    Sertifikatlar topilmadi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Sertifikatni bekor qilishni tasdiqlang"
        description="Bu sertifikat butunlay bekor qilinadi, o'quvchi uni endi ko'ra yoki yuklab ola olmaydi. Bu amalni ortga qaytarib bo'lmaydi."
        confirmLabel="Bekor qilish"
        destructive
        isLoading={isRevoking}
        onConfirm={handleConfirmRevoke}
      />
    </main>
  );
}
