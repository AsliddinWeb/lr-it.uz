"use client";

import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  Code2,
  Laptop,
  Layers,
  Terminal,
} from "lucide-react";

import { EnrollmentStatusTimeline } from "@/components/enrollment-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { useMyEnrollments } from "@/lib/queries/enrollments";
import type { CourseTrack, EnrollmentWithProgress } from "@/lib/types";

const TRACK_ICON: Record<CourseTrack, React.ElementType> = {
  savodxonlik: Laptop,
  python: Code2,
  cpp: Terminal,
};

const TRACK_COVER: Record<CourseTrack, string> = {
  savodxonlik: "bg-gradient-to-br from-indigo-500 to-indigo-800",
  python: "bg-gradient-to-br from-amber-500 to-orange-700",
  cpp: "bg-gradient-to-br from-emerald-500 to-emerald-800",
};

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

function CourseProgressCard({ enrollment }: { enrollment: EnrollmentWithProgress }) {
  const percent =
    enrollment.total_lessons > 0
      ? Math.round((enrollment.completed_lessons / enrollment.total_lessons) * 100)
      : 0;
  const isFinished = enrollment.total_lessons > 0 && percent === 100;
  const TrackIcon = TRACK_ICON[enrollment.course.track];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div
        className={`relative flex h-24 shrink-0 items-center justify-center overflow-hidden ${TRACK_COVER[enrollment.course.track]}`}
      >
        {enrollment.course.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={enrollment.course.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <TrackIcon className="h-10 w-10 text-white/25" />
        )}
        {isFinished && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Tugallandi
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/courses/${enrollment.course.slug}`}
          className="line-clamp-1 font-display text-base font-bold text-text-primary hover:underline"
        >
          {enrollment.course.title}
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-text-muted">{percent}%</span>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          {enrollment.completed_lessons}/{enrollment.total_lessons} mavzu
        </p>

        <Button asChild size="sm" className="mt-4 w-full">
          <Link href={`/courses/${enrollment.course.slug}`}>
            {isFinished ? "Qayta ko'rish" : "Davom etish"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function StudentEnrollmentsPage() {
  const { data: enrollments, isLoading, error, refetch } = useMyEnrollments();

  const activeCourses = enrollments?.filter((e) => e.status === "tasdiqlangan") ?? [];
  const requestHistory = enrollments?.filter((e) => e.status !== "tasdiqlangan") ?? [];
  const pendingCount = enrollments?.filter((e) => e.status === "kutilmoqda").length ?? 0;
  const completedCount = activeCourses.filter(
    (e) => e.total_lessons > 0 && e.completed_lessons === e.total_lessons
  ).length;

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-10">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Mening kurslarim</h1>
          <p className="mt-1 text-sm text-text-muted">
            Tasdiqlangan kurslaringiz va ulardagi progressingiz shu yerda.
          </p>
        </div>

        {error && !enrollments ? (
          <QueryErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={Layers} label="Faol kurslar" value={activeCourses.length} />
              <StatCard icon={Award} label="Tugallangan kurslar" value={completedCount} />
              <StatCard icon={Clock} label="Kutilayotgan so'rovlar" value={pendingCount} />
            </div>

            <div>
              <h2 className="mb-4 font-display text-lg font-bold text-text-primary">Faol kurslarim</h2>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-2xl" />
                  ))}
                </div>
              ) : activeCourses.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeCourses.map((enrollment) => (
                    <CourseProgressCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-text-muted">
                    Hali tasdiqlangan kursingiz yo&apos;q. Kurslar katalogidan boshlang.
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <h2 className="mb-4 font-display text-lg font-bold text-text-primary">
                So&apos;rovlar tarixi
              </h2>
              <div className="space-y-3">
                {isLoading ? (
                  <Skeleton className="h-20 rounded-2xl" />
                ) : requestHistory.length > 0 ? (
                  requestHistory.map((enrollment) => (
                    <Card key={enrollment.id}>
                      <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                        <Link
                          href={`/courses/${enrollment.course.slug}`}
                          className="font-display text-base font-bold text-text-primary hover:underline"
                        >
                          {enrollment.course.title}
                        </Link>
                        <EnrollmentStatusTimeline status={enrollment.status} />
                      </CardHeader>
                      {enrollment.status === "rad_etilgan" && enrollment.rejection_reason && (
                        <CardContent className="text-sm text-text-muted">
                          Sabab: {enrollment.rejection_reason}. Qayta murojaat qilishingiz mumkin.
                        </CardContent>
                      )}
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-text-muted">Kutilayotgan yoki rad etilgan so&apos;rovlaringiz yo&apos;q.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
