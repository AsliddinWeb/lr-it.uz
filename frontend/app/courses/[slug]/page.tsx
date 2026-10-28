"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Code2,
  FileText,
  GraduationCap,
  Laptop,
  Layers,
  Lock,
  CheckCircle2,
  Paperclip,
  Terminal,
  User,
  Video,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnrollmentStatusTimeline } from "@/components/enrollment-status";
import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useCourse } from "@/lib/queries/courses";
import { useCurrentUser, useMyEnrollments } from "@/lib/queries/enrollments";
import { LEVEL_LABELS, TRACK_LABELS, type CourseTrack } from "@/lib/types";

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

const AVATAR_GRADIENT = "bg-gradient-to-br from-indigo-500 to-violet-700";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: course, isLoading } = useCourse(params.slug);
  const { data: user } = useCurrentUser();
  const { data: myEnrollments } = useMyEnrollments(user?.role === "student");
  const [isApplying, setIsApplying] = useState(false);

  const existingEnrollment = myEnrollments?.find((e) => e.course.id === course?.id);

  async function handleApply() {
    if (!user) {
      router.push(`/auth?mode=login&next=${encodeURIComponent(`/courses/${params.slug}`)}`);
      return;
    }
    if (!course) return;

    setIsApplying(true);
    try {
      await apiFetch("/enrollments", {
        method: "POST",
        body: JSON.stringify({ course_id: course.id }),
      });
      toast.success("So'rovingiz yuborildi. Tasdiqlanishini kuting.");
      queryClient.invalidateQueries({ queryKey: ["enrollments", "me"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsApplying(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg">
        <PublicNavbar />
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <Skeleton className="mt-4 h-20 rounded-lg" />
        </div>
        <PublicFooter />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-bg">
        <PublicNavbar />
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-3 px-6 py-24 text-center">
          <p className="text-text-muted">Bunday kurs topilmadi.</p>
          <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
            Kurslar katalogiga qaytish
          </Link>
        </div>
        <PublicFooter />
      </main>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const canAccessLessons = existingEnrollment?.status === "tasdiqlangan";
  const TrackIcon = TRACK_ICON[course.track];
  const authorNames = course.authors.map((a) => a.full_name).join(", ") || "Noma'lum";
  const primaryAuthor = course.authors[0];

  const enrollAction = existingEnrollment ? (
    <EnrollmentStatusTimeline status={existingEnrollment.status} />
  ) : user && user.role !== "student" ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block">
            <Button disabled className="w-full">
              So'rov berish
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Faqat o&apos;quvchilar so'rov bera oladi</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Button onClick={handleApply} disabled={isApplying} className="w-full">
      {isApplying ? "Yuborilmoqda..." : "So'rov berish"}
    </Button>
  );

  return (
    <main className="min-h-screen bg-bg">
      <PublicNavbar />

      <div className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-3 text-sm text-text-muted">
          <Link href="/courses" className="hover:text-primary">
            Kurslar
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-text-primary">{course.title}</span>
        </div>
      </div>

      <section className="border-b border-border bg-surface-2">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex gap-2">
              <Badge variant="default">{TRACK_LABELS[course.track]}</Badge>
              <Badge variant="secondary">{LEVEL_LABELS[course.level]}</Badge>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-text-muted">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                {course.modules.length} modul
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                {totalLessons} mavzu
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {authorNames}
              </span>
            </div>
          </div>
          <div
            className={`relative hidden items-center justify-center overflow-hidden rounded-2xl lg:flex ${TRACK_COVER[course.track]}`}
          >
            {course.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.cover_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <TrackIcon className="h-16 w-16 text-white/20" />
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {course.modules.length > 0 && (
            <div>
              <h2 className="mb-4 font-display text-xl font-bold text-text-primary">
                Bu kursda nimalarni o&apos;rganasiz
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {course.modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-4"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    <span className="text-sm text-text-primary">{module.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 font-display text-xl font-bold text-text-primary">Kurs dasturi</h2>
            {course.modules.length === 0 ? (
              <p className="text-sm text-text-muted">Bu kurs uchun dastur hali e&apos;lon qilinmagan.</p>
            ) : (
              <Accordion
                type="single"
                collapsible
                className="rounded-2xl border border-border bg-surface px-4 shadow-sm"
              >
                {course.modules.map((module, index) => (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="flex flex-col items-start gap-0.5 text-left">
                          <span className="text-text-primary">{module.title}</span>
                          <span className="text-xs font-normal text-text-muted">
                            {module.lessons.length} ta mavzu
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {module.lessons.length === 0 ? (
                        <p className="pl-10 text-text-muted">Mavzular hali qo&apos;shilmagan.</p>
                      ) : (
                        <ul className="space-y-1 pl-10">
                          {module.lessons.map((lesson) => {
                            const ContentIcon = lesson.has_video
                              ? Video
                              : lesson.has_code
                                ? Code2
                                : FileText;
                            const row = (
                              <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm">
                                <span className="flex min-w-0 items-center gap-2 text-text-primary">
                                  <ContentIcon className="h-4 w-4 shrink-0 text-text-muted" />
                                  <span className="truncate">{lesson.title}</span>
                                </span>
                                <span className="flex shrink-0 items-center gap-2 text-text-muted">
                                  {lesson.resource_count > 0 && (
                                    <span className="flex items-center gap-1 text-xs">
                                      <Paperclip className="h-3.5 w-3.5" />
                                      {lesson.resource_count}
                                    </span>
                                  )}
                                  {!canAccessLessons && <Lock className="h-3.5 w-3.5" />}
                                </span>
                              </div>
                            );
                            return (
                              <li key={lesson.id}>
                                {canAccessLessons ? (
                                  <Link
                                    href={`/courses/${course.slug}/lessons/${lesson.id}`}
                                    className="block rounded-lg transition-colors hover:bg-surface-2"
                                  >
                                    {row}
                                  </Link>
                                ) : (
                                  row
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              {primaryAuthor?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryAuthor.avatar_url}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-base font-bold text-white ${AVATAR_GRADIENT}`}
                >
                  {(primaryAuthor?.full_name ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">{authorNames}</p>
                <p className="text-xs text-text-muted">Muallif</p>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <span className="font-display text-2xl font-bold text-success">Bepul</span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {course.modules.length} modul
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {totalLessons} mavzu
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-5">{enrollAction}</div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </main>
  );
}
