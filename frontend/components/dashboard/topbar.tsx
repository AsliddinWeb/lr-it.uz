"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, ChevronDown, Maximize, Menu, Minimize, Moon, Search, Sun } from "lucide-react";

import { CommandPalette } from "@/components/dashboard/command-palette";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCurrentUser } from "@/lib/queries/enrollments";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/queries/notifications";
import { useUiStore } from "@/lib/store/ui";
import type { NotificationDetail } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  student: "O'quvchi",
  author: "Muallif",
  admin: "Administrator",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

const PAGE_TITLES: Record<string, string> = {
  student: "O'quvchi paneli",
  author: "Muallif paneli",
  admin: "Admin paneli",
};

// URL bo'laklari (slug) — foydalanuvchiga ko'rinadigan sarlavhalar.
const SEGMENT_TITLES: Record<string, string> = {
  courses: "Kurslar",
  enrollments: "So'rovlar",
  certificates: "Sertifikatlar",
  leaderboard: "Reyting",
  settings: "Sozlamalar",
  curriculum: "Kurs dasturi",
  stats: "Statistika",
  students: "O'quvchilar",
  message: "Xabar yuborish",
  quiz: "Quiz",
  reject: "So'rovni rad etish",
  users: "Foydalanuvchilar",
  roles: "Rol va huquqlar",
  quizzes: "Quiz banki",
  qa: "Q&A moderatsiya",
  content: "Sayt kontenti",
  broadcast: "Bildirishnoma yuborish",
};

// "new" / "edit" sahifalari — qaysi obyekt ustida ishlanayotganiga qarab.
const NEW_TITLES: Record<string, string> = {
  users: "Yangi foydalanuvchi",
  courses: "Yangi kurs",
  modules: "Yangi modul",
  lessons: "Yangi mavzu",
};
const EDIT_TITLES: Record<string, string> = {
  users: "Foydalanuvchini tahrirlash",
  courses: "Kursni tahrirlash",
  modules: "Modulni tahrirlash",
  lessons: "Mavzuni tahrirlash",
  settings: "Profilni tahrirlash",
};

const DELETE_TITLES: Record<string, string> = {
  users: "Foydalanuvchini o'chirish",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pageTitle(pathname: string, role: string): string {
  // ["dashboard", role, ...] — ID'lar sarlavhaga ta'sir qilmaydi
  const parts = pathname.split("/").filter(Boolean).slice(2).filter((s) => !UUID_RE.test(s));
  const last = parts[parts.length - 1];
  const parent = parts[parts.length - 2];
  if (!last) return PAGE_TITLES[role] ?? "Boshqaruv paneli";
  if (last === "new") return NEW_TITLES[parent] ?? "Yangi";
  if (last === "edit") return EDIT_TITLES[parent] ?? "Tahrirlash";
  if (last === "delete") return DELETE_TITLES[parent] ?? "O'chirish";
  return SEGMENT_TITLES[last] ?? PAGE_TITLES[role] ?? "Boshqaruv paneli";
}

function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }

  return (
    <button
      onClick={toggleFullscreen}
      className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:bg-surface-2 sm:flex"
      aria-label="To'liq ekran"
    >
      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
    </button>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { toggleMobileNav } = useUiStore();

  if (!user) return null;

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  async function handleNotificationClick(notification: NotificationDetail) {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    if (notification.payload.url) {
      router.push(notification.payload.url);
    }
  }

  const title = pageTitle(pathname, user.role);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={toggleMobileNav}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:bg-surface-2 lg:hidden"
          aria-label="Menyu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="hidden truncate font-display text-lg font-bold text-text-primary sm:block">
          {title}
        </h1>
      </div>

      <button
        onClick={() => setPaletteOpen(true)}
        className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-bg px-3 text-sm text-text-muted transition-colors hover:bg-surface-2 sm:max-w-xs md:max-w-sm lg:max-w-md"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden truncate sm:inline">Qidirish...</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-xs sm:inline">
          ⌘K
        </kbd>
      </button>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <FullscreenToggle />

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:bg-surface-2">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border p-3">
              <p className="text-sm font-medium text-text-primary">Bildirishnomalar</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Hammasini o&apos;qilgan qilish
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <p className="p-4 text-sm text-text-muted">Hozircha bildirishnoma yo&apos;q.</p>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block w-full border-b border-border p-3 text-left text-sm transition-colors last:border-0 hover:bg-surface-2 ${
                      notification.is_read ? "text-text-muted" : "text-text-primary"
                    }`}
                  >
                    {notification.payload.title && (
                      <p className="font-medium">{notification.payload.title}</p>
                    )}
                    <p>{notification.payload.message}</p>
                    <p className="mt-1 text-xs text-text-muted">{timeAgo(notification.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:bg-surface-2"
          aria-label="Rejimni almashtirish"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>

        <div className="ml-1 h-8 w-px bg-border" />

        <ProfileMenu
          user={user}
          trigger={
            <button className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition-colors hover:bg-surface-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-[9rem] truncate text-sm font-semibold text-text-primary">
                  {user.full_name}
                </span>
                <span className="block text-xs text-text-muted">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-text-muted md:block" />
            </button>
          }
        />
      </div>
    </header>
  );
}
