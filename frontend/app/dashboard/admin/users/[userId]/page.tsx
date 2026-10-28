"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  BookOpen,
  ClipboardList,
  ListChecks,
  MessageCircleQuestion,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { BackToUsers, UserLoadError, UserPageSkeleton } from "@/components/admin/user-page-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminUser } from "@/lib/queries/admin";
import { useCurrentUser } from "@/lib/queries/enrollments";
import { ROLE_LABELS } from "@/lib/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-text-primary sm:text-right">{children}</dd>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-text-primary">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: user, isLoading, error, refetch } = useAdminUser(userId);
  const { data: me } = useCurrentUser();

  if (isLoading) return <UserPageSkeleton />;
  if (!user) return <UserLoadError error={error} onRetry={() => refetch()} />;

  const isSelf = me?.id === user.id;

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <BackToUsers />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words font-display text-xl font-bold text-text-primary">
            {user.full_name}
            {isSelf && <span className="ml-2 text-sm font-medium text-text-muted">(siz)</span>}
          </h2>
          <p className="break-all text-sm text-text-muted">{user.email}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm">
            <Link href={`/dashboard/admin/users/${user.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Tahrirlash
            </Link>
          </Button>
          {!isSelf && (
            <Button asChild size="sm" variant="outline" className="text-danger hover:text-danger">
              <Link href={`/dashboard/admin/users/${user.id}/delete`}>
                <Trash2 className="h-4 w-4" />
                O&apos;chirish
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid max-w-4xl gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display text-lg">Ma&apos;lumotlar</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <Row label="Rol">
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {ROLE_LABELS[user.role]}
                </Badge>
              </Row>
              <Row label="Holat">
                <Badge variant={user.is_blocked ? "destructive" : "success"}>
                  {user.is_blocked ? "Bloklangan" : "Faol"}
                </Badge>
              </Row>
              <Row label="Email">
                <Badge variant={user.is_email_verified ? "success" : "warning"}>
                  {user.is_email_verified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
                </Badge>
              </Row>
              <Row label="Telegram">
                {user.telegram_chat_id
                  ? user.telegram_username
                    ? `@${user.telegram_username}`
                    : "Ulangan"
                  : "Ulanmagan"}
              </Row>
              <Row label="XP">{user.xp_total}</Row>
              <Row label="Ro'yxatdan o'tgan sana">
                {new Date(user.created_at).toLocaleDateString("uz-UZ")}
              </Row>
            </dl>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:content-start">
          <StatTile icon={ClipboardList} label="So'rovlar" value={user.stats.enrollments} />
          <StatTile icon={Award} label="Sertifikatlar" value={user.stats.certificates} />
          <StatTile icon={BookOpen} label="Muallif kurslari" value={user.stats.authored_courses} />
          <StatTile icon={ListChecks} label="Quiz urinishlari" value={user.stats.quiz_attempts} />
          <StatTile icon={MessageCircleQuestion} label="Savol-javoblar" value={user.stats.qa_posts} />
        </div>
      </div>
    </main>
  );
}
