"use client";

import { Clock, Mail, MessageCircle } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { contentValue, useSiteContent } from "@/lib/queries/content";

const FAQ = [
  {
    question: "Kurslar haqiqatan ham bepulmi?",
    answer: "Ha. Barcha kurslar, AI yordamchi va sertifikatlash butunlay bepul, hech qanday yashirin to'lov yo'q.",
  },
  {
    question: "So'rovim qachon tasdiqlanadi?",
    answer: "Muallif so'rovingizni ko'rib chiqadi, natija Telegram orqali xabar qilinadi.",
  },
  {
    question: "Muammo yuz bersa kimga murojaat qilaman?",
    answer: "Quyidagi email orqali yozing — imkon qadar tezroq javob beramiz.",
  },
];

export default function ContactPage() {
  const { data: items, isLoading } = useSiteContent();
  const email = contentValue(items, "contact_email", "info@edtech.uz");

  return (
    <main className="min-h-screen bg-bg">
      <PublicNavbar />

      <section className="border-b border-border bg-surface-2 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          {isLoading ? (
            <div className="mx-auto max-w-md space-y-3">
              <Skeleton className="h-9 w-2/3 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
                {contentValue(items, "contact_title", "Biz bilan bog'lanish")}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-muted">
                {contentValue(items, "contact_body", "")}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-base font-bold text-text-primary">Email</p>
              <a
                href={`mailto:${email}`}
                className="mt-1 block text-sm text-primary hover:underline"
              >
                {email}
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Clock className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-base font-bold text-text-primary">
                Javob berish vaqti
              </p>
              <p className="mt-1 text-sm text-text-muted">Odatda 1-2 ish kuni ichida</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-text-primary">
            <MessageCircle className="h-5 w-5 text-primary" />
            Tez-tez so&apos;raladigan savollar
          </h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div key={item.question} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <p className="font-display text-sm font-bold text-text-primary">{item.question}</p>
                <p className="mt-1 text-sm text-text-muted">{item.answer}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <PublicFooter />
    </main>
  );
}
