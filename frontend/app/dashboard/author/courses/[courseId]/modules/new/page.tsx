"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, getErrorMessage } from "@/lib/api";

export default function NewModulePage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/courses/${params.courseId}/modules`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      toast.success("Modul qo'shildi");
      router.push(`/dashboard/author/courses/${params.courseId}/curriculum`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Yangi modul qo&apos;shish</CardTitle>
            <CardDescription>Modul kurs dasturini bo&apos;limlarga ajratadi.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Modul sarlavhasi</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Kirish"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || title.trim().length < 2}>
                  {isSubmitting ? "Qo'shilmoqda..." : "Modulni qo'shish"}
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
