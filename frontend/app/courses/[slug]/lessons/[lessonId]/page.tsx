"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  File as FileIcon,
  FileText,
  Layers,
  Play,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { AiChatPanel } from "@/components/ai-chat-panel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";
import { QaPanel } from "@/components/qa-panel";
import { QuizPanel } from "@/components/quiz-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useCodeRun } from "@/hooks/use-code-run";
import { apiFetch, ApiError, getErrorMessage } from "@/lib/api";
import { useCourse } from "@/lib/queries/courses";
import { useLesson } from "@/lib/queries/lessons";
import type { LessonSummary } from "@/lib/types";
import { cn, formatFileSize } from "@/lib/utils";
import { getVideoEmbed } from "@/lib/video-embed";

const MONACO_LANGUAGE: Record<string, string> = { python: "python", cpp: "cpp" };

function lessonIcon(lesson: LessonSummary) {
  if (lesson.has_video) return Video;
  if (lesson.has_code) return Code2;
  return FileText;
}

export default function LessonPage() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const queryClient = useQueryClient();
  const { data: lesson, isLoading, error } = useLesson(params.lessonId);
  const { data: course } = useCourse(params.slug);
  const { run, output, isRunning } = useCodeRun();
  const [code, setCode] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState(false);

  async function handleComplete() {
    setIsCompleting(true);
    try {
      await apiFetch(`/lessons/${params.lessonId}/complete`, { method: "POST" });
      toast.success("Mavzu tugallandi deb belgilandi");
      queryClient.invalidateQueries({ queryKey: ["lesson", params.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["course", params.slug] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsCompleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg">
        <PublicNavbar />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <Skeleton className="h-10 w-1/2 rounded-lg" />
          <Skeleton className="mt-4 h-64 rounded-2xl" />
        </div>
        <PublicFooter />
      </main>
    );
  }

  if (error || !lesson) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Bu mavzuni ko'rish uchun kursga tasdiqlangan so'rovingiz bo'lishi kerak";

    return (
      <main className="min-h-screen bg-bg">
        <PublicNavbar />
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-6 py-24 text-center">
          <p className="text-text-muted">{message}</p>
          <Link href={`/courses/${params.slug}`} className="text-primary hover:underline">
            Kurs sahifasiga qaytish
          </Link>
        </div>
        <PublicFooter />
      </main>
    );
  }

  const editorCode = code || lesson.starter_code || "";
  const videoEmbed = lesson.video_url ? getVideoEmbed(lesson.video_url) : null;

  const flatLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const currentIndex = flatLessons.findIndex((l) => l.id === params.lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

  const totalLessons = flatLessons.length;
  const completedLessons = flatLessons.filter((l) => l.is_completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const currentModule = course?.modules.find((m) =>
    m.lessons.some((l) => l.id === params.lessonId)
  );

  return (
    <main className="min-h-screen bg-bg">
      <PublicNavbar />

      <div className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-6 py-3 text-sm text-text-muted">
          <Link href="/courses" className="shrink-0 hover:text-primary">
            Kurslar
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link href={`/courses/${params.slug}`} className="shrink-0 truncate hover:text-primary">
            {course?.title ?? "Kurs"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-text-primary">{lesson.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="order-2 lg:order-1 lg:col-span-1">
            {course && (
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm lg:sticky lg:top-24">
                <div className="flex items-start gap-3 border-b border-border p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Layers className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-text-primary">Kurs dasturi</p>
                    <p className="truncate text-xs text-text-muted">{course.title}</p>
                  </div>
                </div>

                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-primary">
                      {completedLessons}/{totalLessons} mavzu
                    </span>
                    <span className="font-semibold text-primary">{progressPercent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <Accordion
                  type="multiple"
                  defaultValue={currentModule ? [currentModule.id] : []}
                  className="max-h-[480px] overflow-y-auto px-2"
                >
                  {course.modules.map((module, index) => (
                    <AccordionItem key={module.id} value={module.id} className="border-b-0">
                      <AccordionTrigger className="px-2 py-2.5 text-sm hover:no-underline">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-text-muted">
                            {index + 1}
                          </span>
                          <span className="truncate font-medium text-text-primary">
                            {module.title}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-0.5">
                          {module.lessons.map((moduleLesson) => {
                            const isCurrent = moduleLesson.id === params.lessonId;
                            const Icon = moduleLesson.is_completed
                              ? CheckCircle2
                              : lessonIcon(moduleLesson);
                            return (
                              <li key={moduleLesson.id}>
                                <Link
                                  href={`/courses/${params.slug}/lessons/${moduleLesson.id}`}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                                    isCurrent
                                      ? "bg-primary-soft font-medium text-primary"
                                      : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
                                  )}
                                >
                                  <Icon
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0",
                                      moduleLesson.is_completed && "text-success"
                                    )}
                                  />
                                  <span className="truncate">{moduleLesson.title}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>

          <div className="order-1 space-y-6 lg:order-2 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  {lesson.title}
                </h1>
                {lesson.is_completed && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tugallandi
                  </Badge>
                )}
              </div>

              {videoEmbed && (
                <div className="mt-4 aspect-video overflow-hidden rounded-xl border border-border bg-black">
                  {videoEmbed.type === "file" ? (
                    <video controls className="h-full w-full" src={videoEmbed.src} />
                  ) : (
                    <iframe
                      src={videoEmbed.src}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              )}

              <div className="prose prose-sm mt-4 max-w-none text-text-primary dark:prose-invert prose-headings:font-display prose-headings:text-text-primary prose-a:text-primary">
                <ReactMarkdown>{lesson.content_md}</ReactMarkdown>
              </div>

              {lesson.resources.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-semibold text-text-primary">Resurslar</p>
                  {lesson.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={`/api/v1/lesson-resources/${resource.id}/download`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm transition-colors hover:border-primary/30"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-text-primary">
                        <FileIcon className="h-4 w-4 shrink-0 text-text-muted" />
                        <span className="truncate">{resource.title}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
                        {formatFileSize(resource.size_bytes)}
                        <Download className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {!lesson.language && !lesson.is_completed && (
                <Button size="sm" className="mt-4" onClick={handleComplete} disabled={isCompleting}>
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleting ? "Belgilanmoqda..." : "Mavzuni tugatish"}
                </Button>
              )}
            </div>

            {lesson.language && (
              <div
                className="flex flex-col overflow-hidden rounded-2xl border shadow-sm"
                style={{ backgroundColor: "var(--dark-bg)", borderColor: "var(--dark-border)" }}
              >
                <div
                  className="flex items-center justify-between border-b p-4"
                  style={{ borderColor: "var(--dark-border)" }}
                >
                  <Badge variant="secondary">{lesson.language === "python" ? "Python" : "C++"}</Badge>
                  <Button size="sm" onClick={() => run(params.lessonId, editorCode)} disabled={isRunning}>
                    <Play className="h-4 w-4" />
                    {isRunning ? "Ishga tushirilmoqda..." : "Ishga tushirish"}
                  </Button>
                </div>

                <Editor
                  height="260px"
                  language={MONACO_LANGUAGE[lesson.language]}
                  value={editorCode}
                  onChange={(value) => setCode(value ?? "")}
                  theme="vs-dark"
                  options={{ fontSize: 14, minimap: { enabled: false } }}
                />

                <div className="border-t p-4" style={{ borderColor: "var(--dark-border)" }}>
                  <p className="mb-2 text-sm font-medium" style={{ color: "var(--dark-text-muted)" }}>
                    Natija
                  </p>
                  {!output ? (
                    <p className="text-sm" style={{ color: "var(--dark-text-muted)" }}>
                      Kodni ishga tushirish uchun yuqoridagi tugmani bosing.
                    </p>
                  ) : "error" in output ? (
                    <p className="text-sm text-danger">{output.error}</p>
                  ) : (
                    <div className="space-y-2 font-mono text-sm">
                      {output.stdout && (
                        <pre className="whitespace-pre-wrap" style={{ color: "var(--dark-text)" }}>
                          {output.stdout}
                        </pre>
                      )}
                      {output.stderr && (
                        <pre className="whitespace-pre-wrap text-danger">{output.stderr}</pre>
                      )}
                      {!output.stdout && !output.stderr && (
                        <p style={{ color: "var(--dark-text-muted)" }}>Dastur hech narsa chop etmadi. Natijani ko&apos;rish uchun uni ekranga chiqaring.</p>
                      )}
                      <Badge variant={output.status === "success" ? "success" : "destructive"}>
                        {output.status === "success"
                          ? "Muvaffaqiyatli"
                          : output.status === "timeout"
                            ? "Vaqt tugadi"
                            : "Xatolik"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            <AiChatPanel lessonId={params.lessonId} code={lesson.language ? editorCode : undefined} />
          </div>

          <div className="order-3 lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <QuizPanel lessonId={params.lessonId} />
              <QaPanel lessonId={params.lessonId} />
            </div>
          </div>
        </div>

        {(prevLesson || nextLesson) && (
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
            {prevLesson ? (
              <Link
                href={`/courses/${params.slug}/lessons/${prevLesson.id}`}
                className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:border-primary/30"
              >
                <ChevronLeft className="h-4 w-4 shrink-0 text-text-muted" />
                <span className="min-w-0">
                  <span className="block text-xs text-text-muted">Oldingi mavzu</span>
                  <span className="block truncate font-medium text-text-primary">
                    {prevLesson.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {nextLesson && (
              <Link
                href={`/courses/${params.slug}/lessons/${nextLesson.id}`}
                className="flex min-w-0 items-center justify-end gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-right text-sm transition-colors hover:border-primary/30"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-text-muted">Keyingi mavzu</span>
                  <span className="block truncate font-medium text-text-primary">
                    {nextLesson.title}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
              </Link>
            )}
          </div>
        )}
      </div>

      <PublicFooter />
    </main>
  );
}
