"use client";

import Link from "next/link";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

import { MentorsSection } from "@/components/mentors-section";
import { Reveal } from "@/components/motion/reveal";
import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";
import { StatsSection } from "@/components/stats-section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { contentValue, useSiteContent } from "@/lib/queries/content";

const VALUES = [
  {
    icon: Heart,
    title: "Ta'lim erkin bo'lishi kerak",
    description: "Moliyaviy imkoniyatidan qat'iy nazar, har kim IT sohasini o'rganishi mumkin bo'lishi kerak.",
  },
  {
    icon: Sparkles,
    title: "Nazariyadan ko'ra amaliyot",
    description: "Video tomosha qilish o'rniga, birinchi kundan kod yozib, real natija ko'rasiz.",
  },
  {
    icon: ShieldCheck,
    title: "Sifat va tasdiqlash",
    description: "Har bir kurs tuzilgan dastur asosida, tugatgan o'quvchi tasdiqlangan sertifikat oladi.",
  },
];

export default function AboutPage() {
  const { data: items, isLoading } = useSiteContent();

  return (
    <main className="min-h-screen bg-bg">
      <PublicNavbar />

      <section className="border-b border-border bg-surface-2 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          {isLoading ? (
            <div className="mx-auto max-w-md space-y-3">
              <Skeleton className="h-9 w-2/3 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
                {contentValue(items, "about_title", "EdTech haqida")}
              </h1>
              <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-base leading-relaxed text-text-muted">
                {contentValue(items, "about_body", "")}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <Reveal>
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-text-primary">
            Qadriyatlarimiz
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 0.1}>
              <div className="h-full rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-base font-bold text-text-primary">{title}</p>
                <p className="mt-1 text-sm text-text-muted">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <StatsSection />
      <MentorsSection tinted={false} />

      <Reveal className="px-6 pb-20">
        <div className="mx-auto max-w-3xl rounded-2xl border-t-2 border-primary bg-primary-soft px-8 py-14 text-center">
          <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
            Bizga qo&apos;shiling
          </h2>
          <p className="mx-auto mt-3 max-w-md text-text-muted">
            Bepul ro&apos;yxatdan o&apos;ting va IT sohasini amaliyot orqali o&apos;rganishni boshlang.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/auth?mode=register">Ro&apos;yxatdan o&apos;tish</Link>
          </Button>
        </div>
      </Reveal>

      <PublicFooter />
    </main>
  );
}
