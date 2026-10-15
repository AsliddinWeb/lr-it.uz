"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useEnrollment } from "@/lib/queries/enrollments";

export function RejectEnrollmentForm({
  enrollmentId,
  backHref,
}: {
  enrollmentId: string;
  backHref: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: enrollment, isLoading } = useEnrollment(enrollmentId);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/enrollments/${enrollmentId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      queryClient.invalidateQueries({ queryKey: ["enrollments", "review"] });
      toast.success("So'rov rad etildi");
      router.push(backHref);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-xl">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!enrollment) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
        <p className="text-text-muted">So'rov topilmadi.</p>
        <Link href={backHref} className="text-sm font-medium text-primary hover:underline">
          So'rovlar sahifasiga qaytish
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">So'rovni rad etish</CardTitle>
            <CardDescription>
              {enrollment.student.full_name} ({enrollment.student.email}) —{" "}
              {enrollment.course.title}. Rad etish sababini kiriting — bu o&apos;quvchiga
              ko&apos;rsatiladi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Sabab</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Masalan: profil ma'lumotlari to'liq emas"
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting || reason.trim().length < 3}
                >
                  {isSubmitting ? "Yuborilmoqda..." : "Rad etish"}
                </Button>
                <Button asChild variant="ghost">
                  <Link href={backHref}>Bekor qilish</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
