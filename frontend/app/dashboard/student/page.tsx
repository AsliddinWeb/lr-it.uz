"use client";

import Link from "next/link";
import { Flame, Footprints, Trophy, type LucideIcon } from "lucide-react";

import { RadialProgress } from "@/components/radial-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/queries/enrollments";
import { useMyBadges } from "@/lib/queries/gamification";

const XP_PER_LEVEL = 100;

const BADGE_ICONS: Record<string, LucideIcon> = {
  Footprints,
  Trophy,
  Flame,
};

export default function StudentDashboardPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: badges, isLoading: badgesLoading } = useMyBadges();

  const xpTotal = user?.xp_total ?? 0;
  const level = Math.floor(xpTotal / XP_PER_LEVEL) + 1;
  const progressInLevel = xpTotal % XP_PER_LEVEL;

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Xush kelibsiz{user ? `, ${user.full_name}` : ""}
        </h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Daraja</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              {userLoading ? (
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
              ) : (
                <RadialProgress
                  value={progressInLevel}
                  label={`${progressInLevel}/${XP_PER_LEVEL} XP`}
                />
              )}
              <div>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {level}-daraja
                </p>
                <p className="text-sm text-text-muted">Jami {xpTotal} XP</p>
                <Link
                  href="/dashboard/student/leaderboard"
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  Reyting jadvalini ko&apos;rish
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Yutuqlar</CardTitle>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <Skeleton className="h-16 rounded-lg" />
              ) : badges && badges.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {badges.map((badge) => {
                    const Icon = BADGE_ICONS[badge.icon_key] ?? Trophy;
                    return (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center"
                        title={badge.description}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-xs text-text-muted">{badge.title}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  Hali yutuqlaringiz yo&apos;q. Kod yozing va quiz yeching!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Link href="/courses" className="text-sm text-primary hover:underline">
            Kurslar katalogiga o&apos;tish →
          </Link>
          <Link
            href="/dashboard/student/certificates"
            className="text-sm text-primary hover:underline"
          >
            Sertifikatlarim →
          </Link>
        </div>
      </div>
    </main>
  );
}
