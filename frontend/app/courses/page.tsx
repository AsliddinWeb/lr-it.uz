"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX, Search } from "lucide-react";

import { CourseCard } from "@/components/course-card";
import { Reveal } from "@/components/motion/reveal";
import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { useCourses } from "@/lib/queries/courses";
import {
  LEVEL_LABELS,
  TRACK_LABELS,
  type CourseLevel,
  type CourseTrack,
} from "@/lib/types";

export default function CoursesPage() {
  return (
    <Suspense>
      <CoursesCatalog />
    </Suspense>
  );
}

function CoursesCatalog() {
  const searchParams = useSearchParams();
  const [track, setTrack] = useState<CourseTrack | "all">(
    (searchParams.get("track") as CourseTrack) ?? "all"
  );
  const [level, setLevel] = useState<CourseLevel | "all">("all");
  const [search, setSearch] = useState("");

  const { data: courses, isLoading, error, refetch } = useCourses({
    track: track === "all" ? undefined : track,
    level: level === "all" ? undefined : level,
  });

  const filtered = useMemo(() => {
    if (!courses) return [];
    if (!search.trim()) return courses;
    const q = search.trim().toLowerCase();
    return courses.filter((course) => course.title.toLowerCase().includes(q));
  }, [courses, search]);

  return (
    <main className="min-h-screen bg-bg">
      <PublicNavbar />

      <section className="border-b border-border bg-surface-2 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
            Kurslar katalogi
          </h1>
          <p className="mt-2 max-w-xl text-text-muted">
            Barcha bepul kurslarni ko&apos;ring, o&apos;zingizga mos yo&apos;nalishni tanlang.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kurs nomi bo'yicha qidirish"
              className="pl-9"
            />
          </div>
          <Select value={track} onValueChange={(v) => setTrack(v as CourseTrack | "all")}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Yo'nalish" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha yo&apos;nalishlar</SelectItem>
              {Object.entries(TRACK_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={(v) => setLevel(v as CourseLevel | "all")}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Daraja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha darajalar</SelectItem>
              {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <QueryErrorState error={error} onRetry={() => refetch()} />
          ) : filtered.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-text-muted">{filtered.length} ta kurs topildi</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course, index) => (
                  <Reveal key={course.id} delay={Math.min(index, 6) * 0.06}>
                    <CourseCard course={course} />
                  </Reveal>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-text-muted">
                <SearchX className="h-5 w-5" />
              </span>
              <p className="text-sm text-text-muted">
                Hech qanday kurs topilmadi. Filtrni o&apos;zgartirib ko&apos;ring.
              </p>
            </div>
          )}
        </div>
      </div>

      <PublicFooter />
    </main>
  );
}
