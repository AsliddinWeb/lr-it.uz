"use client";

import { Award, BookOpen, GraduationCap, Users } from "lucide-react";

import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { useHomeStats } from "@/lib/queries/stats";

const CHIP_STYLES = [
  "bg-primary-soft text-primary",
  "bg-accent/10 text-accent",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
];

export function StatsSection() {
  const { data: stats } = useHomeStats();

  const statCards = [
    { icon: BookOpen, label: "Faol kurslar", value: stats?.active_courses ?? 0 },
    { icon: Users, label: "O'quvchilar", value: stats?.students_count ?? 0 },
    { icon: GraduationCap, label: "Mualliflar", value: stats?.mentors_count ?? 0 },
    { icon: Award, label: "Berilgan sertifikatlar", value: stats?.certificates_count ?? 0 },
  ];

  return (
    <section className="border-y border-border bg-surface-2 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ icon: Icon, label, value }, index) => (
            <Reveal key={label} delay={index * 0.08}>
              <div className="h-full rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${CHIP_STYLES[index % CHIP_STYLES.length]}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-3xl font-bold text-text-primary">
                  <CountUp value={value} />
                  <span className="text-primary">+</span>
                </p>
                <p className="mt-1 text-sm text-text-muted">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
