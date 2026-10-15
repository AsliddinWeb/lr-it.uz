"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useCourse } from "@/lib/queries/courses";

export default function EditModulePage() {
  const params = useParams<{ courseId: string; moduleId: string }>();
  const router = useRouter();
  const { data: course, isLoading } = useCourse(params.courseId);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const module_ = course?.modules.find((m) => m.id === params.moduleId);

  useEffect(() => {
    if (module_) setTitle(module_.title);
  }, [module_]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/modules/${params.moduleId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      toast.success("Modul saqlandi");
      router.push(`/dashboard/author/courses/${params.courseId}/curriculum`);
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
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!module_) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
        <p className="text-text-muted">Modul topilmadi.</p>
        <Link
          href={`/dashboard/author/courses/${params.courseId}/curriculum`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Dastur sahifasiga qaytish
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Modulni tahrirlash</CardTitle>
            <CardDescription>Modul sarlavhasini o&apos;zgartiring.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Modul sarlavhasi</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || title.trim().length < 2}>
                  {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/dashboard/author/courses/${params.courseId}/curriculum`}>
                    Bekor qilish
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
