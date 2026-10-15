"use client";

import { useMemo } from "react";

import { Reveal } from "@/components/motion/reveal";
import { useCourses } from "@/lib/queries/courses";

const AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-indigo-500 to-violet-700",
  "bg-gradient-to-br from-amber-500 to-orange-700",
  "bg-gradient-to-br from-emerald-500 to-teal-700",
  "bg-gradient-to-br from-rose-500 to-pink-700",
  "bg-gradient-to-br from-sky-500 to-blue-700",
];

export function MentorsSection({ tinted = true }: { tinted?: boolean }) {
  const { data: courses } = useCourses();

  const mentors = useMemo(() => {
    const map = new Map<
      string,
      { id: string; full_name: string; avatar_url: string | null; courseCount: number }
    >();
    for (const course of courses ?? []) {
      for (const author of course.authors) {
        const existing = map.get(author.id);
        if (existing) existing.courseCount += 1;
        else
          map.set(author.id, {
            id: author.id,
            full_name: author.full_name,
            avatar_url: author.avatar_url,
            courseCount: 1,
          });
      }
    }
    return Array.from(map.values());
  }, [courses]);

  return (
    <section className={tinted ? "border-y border-border bg-surface-2 py-20" : "py-20"}>
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <h2 className="mb-2 font-display text-2xl font-bold text-text-primary">Mualliflar</h2>
          <p className="mb-10 text-text-muted">
            Kurslarni yaratgan va o&apos;quvchilarga hamrohlik qiladigan mualliflar.
          </p>
        </Reveal>
        {mentors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor, index) => (
              <Reveal key={mentor.id} delay={index * 0.1}>
                <div className="flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                  {mentor.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mentor.avatar_url}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-surface-2"
                    />
                  ) : (
                    <span
                      className={`flex h-20 w-20 items-center justify-center rounded-full font-display text-2xl font-bold text-white ring-4 ring-surface-2 ${
                        AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                      }`}
                    >
                      {mentor.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <p className="mt-4 font-display text-base font-bold text-text-primary">
                    {mentor.full_name}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                    {mentor.courseCount} ta kurs
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            Hozircha mualliflarimiz haqida ma&apos;lumot tayyorlanmoqda.
          </p>
        )}
      </div>
    </section>
  );
}
