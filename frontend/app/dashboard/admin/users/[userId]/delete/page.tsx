"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BackToUsers, UserLoadError, UserPageSkeleton } from "@/components/admin/user-page-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useAdminUser } from "@/lib/queries/admin";
import type { UserStats } from "@/lib/types";

const STAT_LABELS: [keyof UserStats, string][] = [
  ["enrollments", "ta kursga so'rov va o'qish tarixi"],
  ["certificates", "ta sertifikat"],
  ["quiz_attempts", "ta quiz urinishi"],
  ["qa_posts", "ta savol-javob yozuvi"],
];

export default function AdminDeleteUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error, refetch } = useAdminUser(userId);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) return <UserPageSkeleton />;
  if (!user) return <UserLoadError error={error} onRetry={() => refetch()} />;

  const detailHref = `/dashboard/admin/users/${user.id}`;
  const blocked = user.delete_blockers.length > 0;
  const confirmed = confirmation.trim().toLowerCase() === user.email.toLowerCase();
  const withData = STAT_LABELS.filter(([key]) => user.stats[key] > 0);

  async function handleDelete() {
    if (!user) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/users/${user.id}`, { method: "DELETE" });
      // O'chirilgan foydalanuvchining detail so'rovini qayta yuklamaymiz (404 chiqadi): keshdan olib tashlaymiz.
      queryClient.removeQueries({ queryKey: ["admin", "user", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`${user.full_name} o'chirildi`);
      router.push("/dashboard/admin/users");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsDeleting(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <BackToUsers />

      <Card className="mt-4 max-w-xl">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <Trash2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <CardTitle className="font-display text-lg">Foydalanuvchini o&apos;chirish</CardTitle>
            <p className="mt-1 break-words text-sm text-text-muted">
              {user.full_name} · {user.email}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {blocked ? (
            <>
              <div className="flex gap-3 rounded-xl bg-warning/10 p-4 text-sm text-text-primary">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div className="space-y-1">
                  <p className="font-medium">Bu foydalanuvchini hozir o&apos;chirib bo&apos;lmaydi:</p>
                  <ul className="list-disc space-y-1 pl-5 text-text-muted">
                    {user.delete_blockers.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link href={detailHref}>Orqaga</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/admin/users/${user.id}/edit`}>
                    <Ban className="h-4 w-4" />
                    Buning o&apos;rniga bloklash
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3 rounded-xl bg-danger/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <div className="space-y-2 text-text-primary">
                  <p className="font-medium">Bu amalni ortga qaytarib bo&apos;lmaydi.</p>
                  {withData.length > 0 ? (
                    <>
                      <p className="text-text-muted">Foydalanuvchi bilan birga quyidagilar ham o&apos;chadi:</p>
                      <ul className="list-disc space-y-0.5 pl-5 text-text-muted">
                        {withData.map(([key, label]) => (
                          <li key={key}>
                            <span className="font-medium tabular-nums text-text-primary">
                              {user.stats[key]}
                            </span>{" "}
                            {label}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-text-muted">Foydalanuvchida boshqa bog&apos;liq ma&apos;lumot yo&apos;q.</p>
                  )}
                  <p className="text-text-muted">
                    Faqat kirishni to&apos;xtatish kerak bo&apos;lsa, o&apos;chirish o&apos;rniga bloklang: ma&apos;lumotlar
                    saqlanadi.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-email">
                  Tasdiqlash uchun foydalanuvchi emailini yozing:{" "}
                  <span className="break-all font-semibold">{user.email}</span>
                </Label>
                <Input
                  id="confirm-email"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  autoComplete="off"
                  placeholder={user.email}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link href={detailHref}>Bekor qilish</Link>
                </Button>
                <Button variant="destructive" disabled={!confirmed || isDeleting} onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "O'chirilmoqda..." : "Foydalanuvchini o'chirish"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
