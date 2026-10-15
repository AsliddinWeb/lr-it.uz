"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useCourse } from "@/lib/queries/courses";
import { useCourseStudents } from "@/lib/queries/author";

export default function MessageStudentPage() {
  return (
    <Suspense>
      <MessageStudentForm />
    </Suspense>
  );
}

function MessageStudentForm() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("student");

  const { data: course } = useCourse(params.courseId);
  const { data: students, isLoading } = useCourseStudents(params.courseId);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const student = studentId ? students?.find((s) => s.student_id === studentId) : null;
  const backHref = `/dashboard/author/courses/${params.courseId}/students`;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 2) return;
    setIsSending(true);
    try {
      const result = await apiFetch<{ sent_count: number }>(
        `/author/courses/${params.courseId}/message`,
        { method: "POST", body: JSON.stringify({ message, student_id: studentId ?? undefined }) }
      );
      toast.success(`${result.sent_count} o'quvchiga yuborildi`);
      router.push(backHref);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSending(false);
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

  if (studentId && !student) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
        <p className="text-text-muted">O&apos;quvchi topilmadi.</p>
        <Link href={backHref} className="text-sm font-medium text-primary hover:underline">
          O&apos;quvchilar sahifasiga qaytish
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {student ? `${student.full_name}ga xabar` : "Barcha o'quvchilarga xabar"}
            </CardTitle>
            <CardDescription>
              {course ? `${course.title} kursi bo'yicha` : ""}
              {student ? ` — ${student.email}` : " — barcha tasdiqlangan o'quvchilarga yuboriladi."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Xabar matni</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Xabar matnini yozing..."
                  rows={5}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSending || message.trim().length < 2}>
                  {isSending ? "Yuborilmoqda..." : "Yuborish"}
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
