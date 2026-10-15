import Link from "next/link";
import { ArrowRight, Code2, Laptop, Terminal } from "lucide-react";

import { LEVEL_LABELS, TRACK_LABELS, type CourseListItem, type CourseTrack } from "@/lib/types";

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

export function CourseCard({ course }: { course: CourseListItem }) {
  const Icon = TRACK_ICON[course.track];

  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
        <div
          className={`relative flex h-36 shrink-0 items-center justify-center overflow-hidden ${TRACK_COVER[course.track]}`}
        >
          {course.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon className="h-14 w-14 text-white/20" />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {TRACK_LABELS[course.track]}
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-text-primary">
            {LEVEL_LABELS[course.level]}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <p className="line-clamp-1 font-display text-lg font-bold text-text-primary">
            {course.title}
          </p>
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-text-muted">{course.description}</p>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="truncate text-xs text-text-muted">
              {course.authors[0]?.full_name ?? "EdTech"}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
              Batafsil
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
