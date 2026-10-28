import Link from "next/link";
import { Award, Code2, Sparkles, type LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Code2, title: "Brauzerda kod yozing", text: "Python va C++ kodini o'rnatmasdan, darhol ishga tushiring." },
  { icon: Sparkles, title: "AI yordamchi", text: "Xatoingizni tushuntirib beradi, kodni tahlil qiladi." },
  { icon: Award, title: "Sertifikat oling", text: "Kursni tugating va tekshirish mumkin bo'lgan sertifikat oling." },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-display text-xl font-bold ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">E</span>
      EdTech
    </Link>
  );
}

/** Kirish/ro'yxatdan o'tish sahifalari uchun umumiy qobiq: chapda brend paneli, o'ngda forma. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ backgroundColor: "var(--dark-bg)", color: "var(--dark-text)" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: "var(--primary)" }}
        />
        <Logo className="relative text-white" />

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Amaliyot orqali IT sohasini o&apos;rganing
          </h2>
          <p className="mt-4" style={{ color: "var(--dark-text-muted)" }}>
            Python, C++ va kompyuter savodxonligi: bepul, real vaqtda kod yozib.
          </p>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "var(--dark-surface)", border: "1px solid var(--dark-border)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm" style={{ color: "var(--dark-text-muted)" }}>
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm" style={{ color: "var(--dark-text-muted)" }}>
          © 2026 EdTech
        </p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <Logo className="text-text-primary lg:hidden" />
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
