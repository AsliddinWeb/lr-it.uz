"use client";

import { Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { useCurrentUser } from "@/lib/queries/enrollments";
import { useLeaderboard } from "@/lib/queries/gamification";
import { cn } from "@/lib/utils";

const PODIUM = [
  { order: "order-2", pedestal: "h-24", ring: "ring-warning/50", badge: "bg-warning text-white" },
  { order: "order-1", pedestal: "h-16", ring: "ring-text-muted/25", badge: "bg-surface-2 text-text-muted" },
  { order: "order-3", pedestal: "h-12", ring: "ring-accent/40", badge: "bg-accent/15 text-accent" },
];

export default function LeaderboardPage() {
  const { data: entries, isLoading, error, refetch } = useLeaderboard();
  const { data: user } = useCurrentUser();

  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];
  const myEntry = entries?.find((e) => e.user_id === user?.id);

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-text-primary">Reyting jadvali</h1>
        <p className="mt-1 text-sm text-text-muted">Eng ko&apos;p XP to&apos;plagan o&apos;quvchilar.</p>

        {isLoading ? (
          <div className="mt-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <QueryErrorState className="mt-8" error={error} onRetry={() => refetch()} />
        ) : entries && entries.length > 0 ? (
          <>
            {top3.length > 0 && (
              <div className="mt-10 flex items-end justify-center gap-3 sm:gap-6">
                {top3.map((entry, i) => {
                  const podium = PODIUM[i];
                  const isMe = entry.user_id === user?.id;
                  return (
                    <div key={entry.user_id} className={cn("flex flex-col items-center", podium.order)}>
                      {i === 0 && <Trophy className="mb-1 h-5 w-5 text-warning" />}
                      <span
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-lg font-bold text-primary ring-4 sm:h-16 sm:w-16",
                          podium.ring
                        )}
                      >
                        {entry.full_name.charAt(0).toUpperCase()}
                      </span>
                      <p className="mt-2 max-w-[100px] truncate text-sm font-semibold text-text-primary sm:max-w-[120px]">
                        {entry.full_name}
                      </p>
                      {isMe && <p className="text-xs font-medium text-primary">(Siz)</p>}
                      <p className="text-xs text-text-muted">{entry.xp_total} XP</p>
                      <div
                        className={cn(
                          "mt-2 flex w-20 items-center justify-center rounded-t-xl font-display text-lg font-bold sm:w-24",
                          podium.pedestal,
                          podium.badge
                        )}
                      >
                        {entry.rank}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {myEntry && myEntry.rank > 3 && (
              <div className="mt-8 flex items-center gap-4 rounded-2xl border border-primary bg-primary-soft px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {myEntry.rank}
                </span>
                <span className="flex-1 font-medium text-primary">Sizning o&apos;rningiz</span>
                <span className="font-display font-bold text-primary">{myEntry.xp_total} XP</span>
              </div>
            )}

            {rest.length > 0 && (
              <Card className="mt-6">
                <CardContent className="divide-y divide-border p-0">
                  {rest.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        entry.user_id === user?.id && "bg-primary-soft"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-text-muted">
                        {entry.rank}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                        {entry.full_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 font-medium text-text-primary">
                        {entry.full_name}
                        {entry.user_id === user?.id && (
                          <span className="ml-2 text-xs text-primary">(Siz)</span>
                        )}
                      </span>
                      <span className="font-display font-bold text-text-primary">
                        {entry.xp_total} XP
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="mt-8">
            <CardContent className="py-10 text-center text-sm text-text-muted">
              Hozircha reytingda hech kim yo&apos;q. Mavzularni tugatib, quiz yeching va birinchi bo&apos;ling.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
