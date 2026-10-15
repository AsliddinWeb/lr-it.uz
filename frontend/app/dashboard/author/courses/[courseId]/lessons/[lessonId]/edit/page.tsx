"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { File as FileIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useLesson } from "@/lib/queries/lessons";
import { formatFileSize } from "@/lib/utils";

type LanguageOption = "none" | "python" | "cpp";

export default function EditLessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const { data: lesson, isLoading, error } = useLesson(params.lessonId);

  const [title, setTitle] = useState("");
  const [contentMd, setContentMd] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [language, setLanguage] = useState<LanguageOption>("none");
  const [starterCode, setStarterCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resourceTitle, setResourceTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setContentMd(lesson.content_md);
      setVideoUrl(lesson.video_url ?? "");
      setLanguage((lesson.language as LanguageOption) ?? "none");
      setStarterCode(lesson.starter_code ?? "");
    }
  }, [lesson]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/lessons/${params.lessonId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          content_md: contentMd,
          video_url: videoUrl.trim() || null,
          language: language === "none" ? null : language,
          starter_code: language === "none" ? null : starterCode,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["lesson", params.lessonId] });
      toast.success("Mavzu saqlandi");
      router.push(`/dashboard/author/courses/${params.courseId}/curriculum`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadResource(file: File) {
    if (!resourceTitle.trim()) {
      toast.error("Avval resurs nomini kiriting");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", resourceTitle.trim());
      formData.append("file", file);
      await apiFetch(`/lessons/${params.lessonId}/resources`, {
        method: "POST",
        body: formData,
      });
      queryClient.invalidateQueries({ queryKey: ["lesson", params.lessonId] });
      setResourceTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Resurs qo'shildi");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteResource(resourceId: string) {
    setDeletingId(resourceId);
    try {
      await apiFetch(`/lesson-resources/${resourceId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["lesson", params.lessonId] });
      toast.success("Resurs o'chirildi");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (error || !lesson) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
        <p className="text-text-muted">Mavzu topilmadi.</p>
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
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Mavzuni tahrirlash</CardTitle>
            <CardDescription>
              Mavzu matni, video havolasi va kod mashqi sozlamalarini yangilang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Mavzu sarlavhasi</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              </div>

              <div className="space-y-1.5">
                <Label>Mavzu matni</Label>
                <Textarea
                  value={contentMd}
                  onChange={(e) => setContentMd(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Video havolasi (YouTube/Vimeo, ixtiyoriy)</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Kod mashqi tili</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as LanguageOption)}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yo'q — faqat matn</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {language !== "none" && (
                <div className="space-y-1.5">
                  <Label>Boshlang&apos;ich kod</Label>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <Editor
                      height="240px"
                      language={language}
                      value={starterCode}
                      onChange={(value) => setStarterCode(value ?? "")}
                      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                      options={{ fontSize: 14, minimap: { enabled: false } }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSubmitting || title.trim().length < 2}>
                  {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/author/courses/${params.courseId}/lessons/${params.lessonId}/quiz`}>
                    Quizni boshqarish
                  </Link>
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

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Resurslar</CardTitle>
            <CardDescription>
              Mavzuga fayl biriktiring (slaydlar, kod namunalari, qo&apos;shimcha materiallar).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lesson.resources.length > 0 ? (
              <ul className="space-y-2">
                {lesson.resources.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileIcon className="h-4 w-4 shrink-0 text-text-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {resource.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatFileSize(resource.size_bytes)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={deletingId === resource.id}
                      onClick={() => handleDeleteResource(resource.id)}
                      className="shrink-0 text-danger hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">Hali fayl biriktirilmagan.</p>
            )}

            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label>Resurs nomi</Label>
                <Input
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Masalan: Mavzu slaydlari"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Yuklanmoqda..." : "Fayl biriktirish"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadResource(file);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
