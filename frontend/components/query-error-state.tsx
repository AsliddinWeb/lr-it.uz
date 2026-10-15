"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api";

/** Ma'lumot yuklanmaganda bo'sh holat o'rniga ko'rsatiladi — "hali hech narsa yo'q" deb adashtirmaslik uchun. */
export function QueryErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <p className="font-display font-bold text-text-primary">Ma&apos;lumotlar yuklanmadi</p>
        <p className="max-w-sm text-sm text-text-muted">{getErrorMessage(error)}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw className="h-4 w-4" />
            Qayta yuklash
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
