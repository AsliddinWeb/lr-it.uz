"use client";

import { useState } from "react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, getErrorMessage } from "@/lib/api";

// 401/403/404 — nosozlik emas, holat: sahifalar ularni o'zi ko'rsatadi (login, "dostup yo'q", "topilmadi").
const STATE_STATUSES = new Set([401, 403, 404]);

function isClientError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

export function QueryClientProviderWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof ApiError && STATE_STATUSES.has(error.status)) return;
            const message = getErrorMessage(error);
            // Bir nechta so'rov bir xil sabab bilan yiqilsa, bitta toast ko'rsatiladi.
            toast.error(message, { id: message });
          },
        }),
        defaultOptions: {
          queries: {
            // 4xx qayta urinishdan tuzalmaydi — foydalanuvchini skeleton bilan kuttirmaymiz.
            retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
          },
        },
      })
  );

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
}
