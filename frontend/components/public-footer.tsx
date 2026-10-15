"use client";

import Link from "next/link";

import { contentValue, useSiteContent } from "@/lib/queries/content";
import { TRACK_LABELS } from "@/lib/types";

const PAGE_LINKS = [
  { label: "Kurslar", href: "/courses" },
  { label: "Biz haqimizda", href: "/about" },
  { label: "Aloqa", href: "/contact" },
];

const TRACK_LINKS = (Object.keys(TRACK_LABELS) as (keyof typeof TRACK_LABELS)[]).map((key) => ({
  label: TRACK_LABELS[key],
  href: `/courses?track=${key}`,
}));

const START_LINKS = [
  { label: "Ro'yxatdan o'tish", href: "/auth/register" },
  { label: "Kirish", href: "/auth/login" },
];

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold" style={{ color: "var(--dark-text)" }}>
        {title}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--dark-text-muted)" }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicFooter() {
  const { data: items } = useSiteContent();
  const email = contentValue(items, "contact_email", "info@edtech.uz");
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative isolate overflow-hidden border-t-2"
      style={{ backgroundColor: "var(--dark-bg)", borderColor: "var(--primary)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary opacity-[0.15] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-accent opacity-[0.12] blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-0 select-none font-display font-bold leading-none"
        style={{ fontSize: "clamp(120px, 16vw, 220px)", opacity: 0.035, color: "var(--dark-text)" }}
      >
        EdTech
      </span>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="relative isolate flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              <span className="absolute inset-0 -z-10 rounded-lg bg-primary opacity-60 blur-md" />
              E
            </span>
            <p className="font-display text-sm font-bold" style={{ color: "var(--dark-text)" }}>
              EdTech
            </p>
          </div>
          <p className="mt-3 max-w-xs text-sm" style={{ color: "var(--dark-text-muted)" }}>
            Amaliyot orqali IT sohasini o&apos;rganish uchun bepul platforma — Python, C++ va
            kompyuter savodxonligi.
          </p>
          <a
            href={`mailto:${email}`}
            className="mt-3 inline-block text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--dark-text-muted)" }}
          >
            {email}
          </a>
        </div>

        <FooterColumn title="Sahifalar" links={PAGE_LINKS} />
        <FooterColumn title="Yo'nalishlar" links={TRACK_LINKS} />
        <FooterColumn title="Boshlash" links={START_LINKS} />
      </div>

      <div className="relative border-t px-6 py-4" style={{ borderColor: "var(--dark-border)" }}>
        <p className="mx-auto max-w-6xl text-xs" style={{ color: "var(--dark-text-muted)" }}>
          © {year} EdTech. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </footer>
  );
}
