"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCourse } from "@/lib/queries/courses";
import { useCourseStudents } from "@/lib/queries/author";

export default function CourseStudentsPage() {
  const params = useParams<{ courseId: string }>();
  const { data: course } = useCourse(params.courseId);
  const { data: students, isLoading, error, refetch } = useCourseStudents(params.courseId);

  return (
    <main className="px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">
            O&apos;quvchilar {course ? `— ${course.title}` : ""}
          </h2>
          <p className="text-sm text-text-muted">Kursga yozilgan o&apos;quvchilar va progresslari.</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/author/courses/${params.courseId}/students/message`}>
            <Send className="h-4 w-4" />
            Hammaga xabar yuborish
          </Link>
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <QueryErrorState className="border-0 shadow-none" error={error} onRetry={() => refetch()} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ism</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>So&apos;nggi faollik</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((student) => (
                <TableRow key={student.student_id}>
                  <TableCell className="font-medium">
                    {student.full_name}
                    <span className="block text-xs text-text-muted">{student.email}</span>
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {student.completed_lessons}/{student.total_lessons} ({student.completion_pct}%)
                  </TableCell>
                  <TableCell className="text-text-muted">{student.xp_total}</TableCell>
                  <TableCell className="text-text-muted">
                    {student.last_activity
                      ? new Date(student.last_activity).toLocaleDateString("uz-UZ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/dashboard/author/courses/${params.courseId}/students/message?student=${student.student_id}`}
                      >
                        Xabar yuborish
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {students?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-text-muted">
                    Hozircha tasdiqlangan o&apos;quvchilar yo&apos;q. Kutilayotgan so&apos;rovlarni &quot;So&apos;rovlar&quot; bo&apos;limida ko&apos;rib chiqing.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
}
