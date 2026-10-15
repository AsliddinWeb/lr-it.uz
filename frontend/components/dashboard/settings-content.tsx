"use client";

import Link from "next/link";
import { CheckCircle2, Pencil, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/queries/enrollments";

const ROLE_LABELS: Record<string, string> = {
  student: "O'quvchi",
  author: "Muallif",
  admin: "Administrator",
};

export function SettingsContent() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading || !user) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-lg">Profil ma&apos;lumotlari</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/${user.role}/settings/edit`}>
              <Pencil className="h-4 w-4" />
              Tahrirlash
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-text-muted">Ism-familiya</span>
            <span className="font-medium text-text-primary">{user.full_name}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-text-muted">Email</span>
            <span className="font-medium text-text-primary">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Rol</span>
            <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Telegram</CardTitle>
        </CardHeader>
        <CardContent>
          {user.telegram_chat_id ? (
            <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">
                @{user.telegram_username ?? "foydalanuvchi"} sifatida bog&apos;langan
              </span>
            </div>
          ) : (
            <Link
              href="/auth/telegram-link"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Send className="h-4 w-4" />
              Telegramni bog&apos;lash
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
