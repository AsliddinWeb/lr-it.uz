"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/queries/enrollments";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Kurslar", href: "/courses" },
  { label: "Biz haqimizda", href: "/about" },
  { label: "Aloqa", href: "/contact" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: user } = useCurrentUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-surface/70 backdrop-blur-md transition-shadow",
        scrolled ? "border-border shadow-sm" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            E
          </span>
          EdTech
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href ? "text-primary" : "text-text-muted hover:text-text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:bg-surface-2"
            aria-label="Rejimni almashtirish"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <Button asChild size="sm">
                <Link href={`/dashboard/${user.role}`}>Boshqaruv paneli</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/auth/login">Kirish</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register">Ro&apos;yxatdan o&apos;tish</Link>
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:bg-surface-2 sm:hidden"
            aria-label="Menyu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border bg-surface sm:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary-soft text-primary"
                      : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 border-t border-border pt-4">
                {user ? (
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/dashboard/${user.role}`}>Boshqaruv paneli</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href="/auth/login">Kirish</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/auth/register">Ro&apos;yxatdan o&apos;tish</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
