"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { ApiError } from "@/lib/api";
import { useCourse } from "@/lib/queries/courses";

export default function CurriculumBuilderPage() {
  const params = useParams<{ courseId: string }>();
  const { data: course, isLoading, error, refetch } = useCourse(params.courseId);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </main>
    );
  }

  // 404 — "Kurs topilmadi" pastda; boshqa xatolarda kursni yo'q deb ko'rsatmaymiz.
  if (error && !course && !(error instanceof ApiError && error.status === 404)) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <QueryErrorState error={error} onRetry={() => refetch()} />
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
        <p className="text-text-muted">Kurs topilmadi.</p>
        <Link href="/dashboard/author/courses" className="text-sm font-medium text-primary hover:underline">
          Mening kurslarim sahifasiga qaytish
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              {course.title} — dastur
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Modul va mavzular kurs dasturini tashkil qiladi.
            </p>
          </div>
          <Link
            href={`/dashboard/author/courses/${course.id}/edit`}
            className="text-sm text-primary hover:underline"
          >
            Kurs ma&apos;lumotlarini tahrirlash
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {course.modules.map((module, index) => (
            <Card key={module.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="font-display text-lg">
                  {index + 1}. {module.title}
                </CardTitle>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/dashboard/author/courses/${course.id}/modules/${module.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Tahrirlash
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {module.lessons.length > 0 && (
                  <ul className="space-y-2">
                    {module.lessons.map((lesson, i) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-text-muted" />
                          <span className="text-sm text-text-primary">
                            {i + 1}. {lesson.title}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/dashboard/author/courses/${course.id}/lessons/${lesson.id}/quiz`}
                            >
                              Quiz
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link
                              href={`/dashboard/author/courses/${course.id}/lessons/${lesson.id}/edit`}
                            >
                              <Pencil className="h-4 w-4" />
                              Tahrirlash
                            </Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/dashboard/author/courses/${course.id}/modules/${module.id}/lessons/new`}>
                    <Plus className="h-4 w-4" />
                    Mavzu qo&apos;shish
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}

          {course.modules.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-text-muted">
                Hozircha modul yo&apos;q. Birinchi modulni qo&apos;shing.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6">
          <Button asChild>
            <Link href={`/dashboard/author/courses/${course.id}/modules/new`}>
              <Plus className="h-4 w-4" />
              Modul qo&apos;shish
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
