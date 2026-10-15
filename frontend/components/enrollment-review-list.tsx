"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EnrollmentStatusTimeline } from "@/components/enrollment-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useCurrentUser, useEnrollments } from "@/lib/queries/enrollments";
import type { EnrollmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: EnrollmentStatus | "all"; label: string }[] = [
  { value: "kutilmoqda", label: "Kutilmoqda" },
  { value: "tasdiqlangan", label: "Tasdiqlangan" },
  { value: "rad_etilgan", label: "Rad etilgan" },
  { value: "all", label: "Barchasi" },
];

export function EnrollmentReviewList() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "all">("kutilmoqda");
  const { data: enrollments, isLoading } = useEnrollments(
    statusFilter === "all" ? undefined : statusFilter
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApprove(id: string) {
    setIsSubmitting(true);
    try {
      await apiFetch(`/enrollments/${id}/approve`, { method: "PATCH" });
      toast.success("So'rov tasdiqlandi");
      queryClient.invalidateQueries({ queryKey: ["enrollments", "review"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-primary text-white"
                : "bg-surface-2 text-text-muted hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !enrollments || enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-text-muted">
            Hozircha bu holatda so&apos;rovlar yo&apos;q.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-text-primary">
                    {enrollment.course.title}
                  </p>
                  <p className="text-sm text-text-muted break-words">
                    {enrollment.student.full_name} · {enrollment.student.email}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    So&apos;ralgan: {new Date(enrollment.requested_at).toLocaleDateString("uz-UZ")}
                    {enrollment.reviewed_at &&
                      ` · Ko'rib chiqilgan: ${new Date(enrollment.reviewed_at).toLocaleDateString("uz-UZ")}`}
                  </p>
                </div>
                <EnrollmentStatusTimeline status={enrollment.status} />
              </CardHeader>
              {enrollment.status === "kutilmoqda" && (
                <CardContent className="flex gap-2">
                  <Button size="sm" disabled={isSubmitting} onClick={() => handleApprove(enrollment.id)}>
                    Tasdiqlash
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/${user?.role}/enrollments/${enrollment.id}/reject`}>
                      Rad etish
                    </Link>
                  </Button>
                </CardContent>
              )}
              {enrollment.status === "rad_etilgan" && enrollment.rejection_reason && (
                <CardContent className="text-sm text-text-muted">
                  Sabab: {enrollment.rejection_reason}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
