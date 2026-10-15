"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  ChevronsLeft,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  MessageCircleQuestion,
  ShieldCheck,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/lib/queries/enrollments";
import { useUiStore } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: Record<string, NavGroup[]> = {
  student: [
    {
      label: "Asosiy",
      items: [
        { label: "Boshqaruv paneli", href: "/dashboard/student", icon: LayoutDashboard },
        { label: "Mening kurslarim", href: "/dashboard/student/enrollments", icon: ClipboardList },
        { label: "Kurslar katalogi", href: "/courses", icon: BookOpen },
      ],
    },
    {
      label: "Yutuqlar",
      items: [
        { label: "Reyting", href: "/dashboard/student/leaderboard", icon: Trophy },
        { label: "Sertifikatlarim", href: "/dashboard/student/certificates", icon: Award },
      ],
    },
  ],
  author: [
    {
      label: "Asosiy",
      items: [
        { label: "Boshqaruv paneli", href: "/dashboard/author", icon: LayoutDashboard },
        { label: "Mening kurslarim", href: "/dashboard/author/courses", icon: BookOpen },
        { label: "So'rovlar", href: "/dashboard/author/enrollments", icon: ClipboardList },
      ],
    },
  ],
  admin: [
    {
      label: "Asosiy",
      items: [{ label: "Boshqaruv paneli", href: "/dashboard/admin", icon: LayoutDashboard }],
    },
    {
      label: "Boshqaruv",
      items: [
        { label: "Foydalanuvchilar", href: "/dashboard/admin/users", icon: Users },
        { label: "Kurslar", href: "/dashboard/admin/courses", icon: BookOpen },
        { label: "So'rovlar", href: "/dashboard/admin/enrollments", icon: ClipboardList },
        { label: "Q&A moderatsiya", href: "/dashboard/admin/qa", icon: MessageCircleQuestion },
      ],
    },
    {
      label: "Tizim",
      items: [
        { label: "Sertifikatlar", href: "/dashboard/admin/certificates", icon: Award },
        { label: "Quiz banki", href: "/dashboard/admin/quizzes", icon: HelpCircle },
        { label: "Bildirishnoma yuborish", href: "/dashboard/admin/broadcast", icon: Megaphone },
        { label: "Sayt kontenti", href: "/dashboard/admin/content", icon: FileText },
        { label: "Rol/huquqlar", href: "/dashboard/admin/roles", icon: ShieldCheck },
      ],
    },
  ],
};

function NavList({
  groups,
  collapsed,
  dashboardRoot,
  onNavigate,
}: {
  groups: NavGroup[];
  collapsed: boolean;
  dashboardRoot: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
      {groups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p
              className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive =
                item.href === dashboardRoot
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    collapsed && "justify-center px-0",
                    !isActive && "hover:bg-white/[0.06]"
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--sidebar-primary)",
                          color: "#ffffff",
                          boxShadow: "0 4px 14px -2px rgba(99, 102, 241, 0.45)",
                        }
                      : { color: "var(--sidebar-text-muted)" }
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (!collapsed) {
                return <div key={item.href}>{link}</div>;
              }

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, closeMobileNav } = useUiStore();

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  if (!user) return null;

  const groups = NAV_GROUPS[user.role] ?? [];
  const dashboardRoot = `/dashboard/${user.role}`;

  return (
    <TooltipProvider>
      {/* Desktop sidebar — persistent, collapsible */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col transition-[width] duration-200 ease-in-out lg:flex",
          sidebarCollapsed ? "w-[84px]" : "w-[264px]"
        )}
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        <div
          className="flex h-16 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(255,255,255,0.04)]"
          style={{ backgroundColor: "var(--sidebar-surface)", borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <span
            className="relative isolate flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: "var(--sidebar-primary)" }}
          >
            <span
              className="absolute inset-0 -z-10 rounded-lg opacity-50 blur-md"
              style={{ backgroundColor: "var(--sidebar-primary)" }}
            />
            E
          </span>
          {!sidebarCollapsed && (
            <span className="font-display text-lg font-bold" style={{ color: "var(--sidebar-text)" }}>
              EdTech
            </span>
          )}
        </div>

        <NavList groups={groups} collapsed={sidebarCollapsed} dashboardRoot={dashboardRoot} />

        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors hover:bg-white/10"
          style={{ backgroundColor: "var(--sidebar-surface)", borderColor: "var(--sidebar-border)", color: "var(--sidebar-text-muted)" }}
          aria-label={sidebarCollapsed ? "Kengaytirish" : "Yig'ish"}
        >
          <ChevronsLeft className={cn("h-3.5 w-3.5 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile sidebar — overlay drawer, hidden on desktop */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50"
              onClick={closeMobileNav}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative flex h-full w-[264px] flex-col"
              style={{ backgroundColor: "var(--sidebar-bg)" }}
            >
              <div
                className="flex h-16 shrink-0 items-center gap-2 px-4"
                style={{ backgroundColor: "var(--sidebar-surface)", borderBottom: "1px solid var(--sidebar-border)" }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--sidebar-primary)" }}
                >
                  E
                </span>
                <span className="font-display text-lg font-bold" style={{ color: "var(--sidebar-text)" }}>
                  EdTech
                </span>
              </div>

              <NavList
                groups={groups}
                collapsed={false}
                dashboardRoot={dashboardRoot}
                onNavigate={closeMobileNav}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
