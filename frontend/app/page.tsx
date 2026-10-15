"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  Code2,
  Gift,
  GraduationCap,
  Laptop,
  Sparkles,
  Terminal,
  UserPlus,
} from "lucide-react";

import { CodeMockup } from "@/components/code-mockup";
import { CourseCard } from "@/components/course-card";
import { HeroBackground } from "@/components/hero-background";
import { MentorsSection } from "@/components/mentors-section";
import { Reveal } from "@/components/motion/reveal";
import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";
import { StatsSection } from "@/components/stats-section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { contentValue, useSiteContent } from "@/lib/queries/content";
import { useCourses } from "@/lib/queries/courses";
import { TRACK_LABELS, type CourseTrack } from "@/lib/types";

const TRACKS: { key: CourseTrack; icon: React.ElementType; description: string }[] = [
  {
    key: "savodxonlik",
    icon: Laptop,
    description: "Kompyuter va internet bilan ishlashning asosiy ko'nikmalari.",
  },
  {
    key: "python",
    icon: Code2,
    description: "Noldan boshlab Python dasturlash tilini amaliyot orqali o'rganing.",
  },
  {
    key: "cpp",
    icon: Terminal,
    description: "Algoritmlar va tizim dasturlashning asosini C++ orqali egallang.",
  },
];

const CHIP_STYLES = [
  "bg-primary-soft text-primary",
  "bg-accent/10 text-accent",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
];

const TRUST_ITEMS: { icon: React.ElementType; title: string; description: string }[] = [
  {
    icon: Gift,
    title: "Bepul, cheklovsiz",
    description: "Hech qanday to'lov yoki obuna talab qilinmaydi — barcha kurslar butunlay bepul.",
  },
  {
    icon: Sparkles,
    title: "AI yordamchi har mavzuda",
    description: "Har bir mavzuda AI yordamchidan savol so'rab, kodingizni tekshirtirishingiz mumkin.",
  },
  {
    icon: Code2,
    title: "Amaliy kod mashqlari",
    description: "Brauzerda to'g'ridan-to'g'ri kod yozing va natijasini shu zahoti ko'ring.",
  },
  {
    icon: Award,
    title: "Tugatgach — sertifikat",
    description: "Kursni yakunlab, ulashish mumkin bo'lgan tasdiqlangan sertifikat oling.",
  },
];

const STEPS: { icon: React.ElementType; title: string; description: string }[] = [
  {
    icon: UserPlus,
    title: "Ro'yxatdan o'ting",
    description: "Bepul, bir necha soniyada.",
  },
  {
    icon: BookOpen,
    title: "Kursni tanlang",
    description: "Python, C++ yoki kompyuter savodxonligi.",
  },
  {
    icon: Terminal,
    title: "Amaliyot qiling",
    description: "Real vaqtda kod yozing, AI yordamchidan so'rang.",
  },
  {
    icon: GraduationCap,
    title: "Sertifikat oling",
    description: "Kursni tugatib, tasdiqlangan sertifikatni yuklab oling.",
  },
];

export default function HomePage() {
  const { data: courses, isLoading, error, refetch } = useCourses();
  const { data: content } = useSiteContent();

  const heroRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-16, 16]), {
    stiffness: 60,
    damping: 20,
  });
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-16, 16]), {
    stiffness: 60,
    damping: 20,
  });

  function handleHeroMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  const trackCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const course of courses ?? []) {
      counts[course.track] = (counts[course.track] ?? 0) + 1;
    }
    return counts;
  }, [courses]);

  return (
    <main className="min-h-screen bg-bg">
      <PublicNavbar />

      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative isolate flex min-h-[85vh] items-center overflow-hidden bg-bg px-6 pb-16 pt-28"
      >
        <motion.div style={{ x: parallaxX, y: parallaxY }} className="absolute inset-0 -z-10">
          <HeroBackground />
        </motion.div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold tracking-wide text-primary shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              100% BEPUL · AI YORDAMIDA
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-text-primary sm:text-6xl"
            >
              {contentValue(content, "home_hero_title", "Kod yozib, IT mutaxassisiga aylaning")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 max-w-lg text-base text-text-muted"
            >
              {contentValue(
                content,
                "home_hero_subtitle",
                "Brauzeringizda real kod yozing, AI yordamchidan maslahat oling va Python, C++, kompyuter savodxonligini butunlay bepul o'rganing."
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button asChild size="lg">
                <Link href="/courses">Kurslarni ko&apos;rish</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#qanday-ishlaydi">Qanday ishlashini bilish</a>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[2rem] opacity-50 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--primary) 30%, transparent), color-mix(in srgb, var(--accent) 25%, transparent))",
              }}
            />
            <CodeMockup />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${CHIP_STYLES[index % CHIP_STYLES.length]}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-base font-bold text-text-primary">{title}</p>
                <p className="mt-1 text-sm text-text-muted">{description}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <StatsSection />

      <section className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <h2 className="mb-6 font-display text-2xl font-bold text-text-primary">
            Yo&apos;nalishlar
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {TRACKS.map(({ key, icon: Icon, description }, index) => (
            <Reveal key={key} delay={index * 0.1}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
                <Link
                  href={`/courses?track=${key}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${CHIP_STYLES[index % CHIP_STYLES.length]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {trackCounts[key] ? (
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-muted">
                        {trackCounts[key]} ta kurs
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 font-display text-lg font-bold text-text-primary">
                    {TRACK_LABELS[key]}
                  </p>
                  <p className="mt-1 flex-1 text-sm text-text-muted">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Ko&apos;rish <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="qanday-ishlaydi" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-20">
        <Reveal>
          <h2 className="mb-2 font-display text-2xl font-bold text-text-primary">
            Qanday ishlaydi
          </h2>
          <p className="mb-10 text-text-muted">
            To&apos;rt qadamda bepul o&apos;rganishni boshlang.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 0.1}>
              <div className="h-full rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${CHIP_STYLES[index % CHIP_STYLES.length]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 font-display text-lg font-bold text-text-primary">{title}</p>
                <p className="mt-1 text-sm text-text-muted">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <MentorsSection />

      <section className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <h2 className="mb-6 font-display text-2xl font-bold text-text-primary">
            So&apos;nggi kurslar
          </h2>
        </Reveal>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <QueryErrorState error={error} onRetry={() => refetch()} />
        ) : courses && courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map((course, index) => (
              <Reveal key={course.id} delay={index * 0.1}>
                <CourseCard course={course} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            Hozircha faol kurslar yo&apos;q. Tez orada yangi kurslar qo&apos;shiladi.
          </p>
        )}
      </section>

      <Reveal className="px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-2xl border-t-2 border-primary bg-primary-soft px-8 py-14 text-center">
          <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
            Bugunoq bepul boshlang
          </h2>
          <p className="mx-auto mt-3 max-w-md text-text-muted">
            Ro&apos;yxatdan o&apos;ting va birinchi kursingizga hoziroq so'rov bering.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/auth/register">Ro&apos;yxatdan o&apos;tish</Link>
          </Button>
        </div>
      </Reveal>

      <PublicFooter />
    </main>
  );
}
