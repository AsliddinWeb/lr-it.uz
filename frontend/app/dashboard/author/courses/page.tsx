"use client";

import Link from "next/link";
import { BarChart3, Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { useCourses } from "@/lib/queries/courses";
import { LEVEL_LABELS, TRACK_LABELS, type CourseStatus } from "@/lib/types";

const STATUS_LABELS: Record<CourseStatus, string> = {
  qoralama: "Qoralama",
  kutilmoqda: "Kutilmoqda",
  faol: "Faol",
  arxiv: "Arxiv",
};

const STATUS_VARIANT: Record<CourseStatus, "secondary" | "warning" | "success" | "outline"> = {
  qoralama: "secondary",
  kutilmoqda: "warning",
  faol: "success",
  arxiv: "outline",
};

export default function AuthorCoursesPage() {
  const { data: courses, isLoading, error, refetch } = useCourses({ mine: true });

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Mening kurslarim
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Yaratgan kurslaringizni bu yerda boshqarasiz.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/author/courses/new">
              <Plus className="h-4 w-4" />
              Yangi kurs
            </Link>
          </Button>
        </div>

        <div className="mt-8 space-y-3">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
          ) : error ? (
            <QueryErrorState error={error} onRetry={() => refetch()} />
          ) : courses && courses.length > 0 ? (
            courses.map((course) => (
              <Card key={course.id} className="transition-colors hover:bg-surface-2">
                <Link href={`/dashboard/author/courses/${course.id}/curriculum`}>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                      <p className="font-display text-lg font-bold text-text-primary">
                        {course.title}
                      </p>
                      <div className="mt-1 flex gap-1.5">
                        <Badge variant="secondary">{TRACK_LABELS[course.track]}</Badge>
                        <Badge variant="secondary">{LEVEL_LABELS[course.level]}</Badge>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[course.status]}>
                      {STATUS_LABELS[course.status]}
                    </Badge>
                  </CardHeader>
                </Link>
                <CardContent className="flex gap-2 pt-0">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/author/courses/${course.id}/students`}>
                      <Users className="h-4 w-4" />
                      O&apos;quvchilar
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/author/courses/${course.id}/stats`}>
                      <BarChart3 className="h-4 w-4" />
                      Statistika
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-text-muted">
                Hozircha kurslaringiz yo&apos;q. Birinchi kursingizni yarating va
                o&apos;quvchilarga ulashing.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
