"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api";
import type { UserPublic } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  student: "O'quvchi",
  author: "Muallif",
  admin: "Administrator",
};

export function ProfileMenu({ user, trigger }: { user: UserPublic; trigger: ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/auth/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-0">
        <div className="flex items-center gap-3 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-base font-bold text-primary">
            {user.full_name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{user.full_name}</p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-1.5">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/${user.role}/settings`}>
              <UserIcon className="h-4 w-4" />
              Profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/${user.role}/settings`}>
              <Settings className="h-4 w-4" />
              Sozlamalar
            </Link>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-1.5">
          <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger">
            <LogOut className="h-4 w-4" />
            Chiqish
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
