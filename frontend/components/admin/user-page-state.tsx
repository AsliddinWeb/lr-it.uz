"use client";

import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";

import { QueryErrorState } from "@/components/query-error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";

export function BackToUsers() {
  return (
    <Link
      href="/dashboard/admin/users"
      className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      Foydalanuvchilar
    </Link>
  );
}

export function UserPageSkeleton() {
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-4 h-72 max-w-xl rounded-2xl" />
    </main>
  );
}

/** Foydalanuvchi yuklanmaganda: topilmadi (404) yoki boshqa xato. */
export function UserLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <BackToUsers />
      <div className="mt-4 max-w-xl">
        {notFound ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <UserX className="h-6 w-6" />
              </span>
              <p className="font-display font-bold text-text-primary">Foydalanuvchi topilmadi</p>
              <p className="max-w-sm text-sm text-text-muted">
                U o&apos;chirilgan bo&apos;lishi mumkin. Ro&apos;yxatdan boshqa foydalanuvchini tanlang.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/users">Foydalanuvchilar ro&apos;yxatiga qaytish</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <QueryErrorState error={error} onRetry={onRetry} />
        )}
      </div>
    </main>
  );
}
