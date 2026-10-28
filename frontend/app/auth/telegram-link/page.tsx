"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useCurrentUser } from "@/lib/queries/enrollments";

export default function TelegramLinkPage() {
  const router = useRouter();
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const { data: user, isLoading, isError } = useCurrentUser({
    refetchInterval: deepLink ? 3000 : undefined,
  });

  useEffect(() => {
    if (isError) {
      router.push("/auth?mode=login&next=%2Fauth%2Ftelegram-link");
    }
  }, [isError, router]);

  useEffect(() => {
    if (user?.telegram_chat_id && deepLink) {
      toast.success("Telegram akkountingiz bog'landi!");
      setDeepLink(null);
    }
  }, [user, deepLink]);

  async function handleLink() {
    setIsRequesting(true);
    try {
      const res = await apiFetch<{ token: string; deep_link: string }>("/auth/telegram/link", {
        method: "POST",
      });
      setDeepLink(res.deep_link);
      window.open(res.deep_link, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  }

  if (isLoading) {
    return (
      <AuthCard title="Telegramni bog'lash" description="Yuklanmoqda...">
        <div />
      </AuthCard>
    );
  }

  if (user?.telegram_chat_id) {
    return (
      <AuthCard
        title="Telegramni bog'lash"
        description="Akkountingiz Telegram bilan bog'langan."
      >
        <div className="flex items-center gap-2 rounded-xl bg-success/10 p-4 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">
            @{user.telegram_username ?? "foydalanuvchi"} sifatida bog'langan
          </span>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Telegramni bog'lash"
      description="So'rovingiz tasdiqlanganda kirish xabari Telegram orqali yuboriladi."
    >
      {deepLink ? (
        <p className="text-sm text-text-muted">
          Telegram ochildi — botda <strong>Start</strong> tugmasini bosing. Bog&apos;langach bu
          sahifa avtomatik yangilanadi.
        </p>
      ) : (
        <Button onClick={handleLink} disabled={isRequesting} className="w-full">
          <Send className="h-4 w-4" />
          {isRequesting ? "Havola tayyorlanmoqda..." : "Telegram orqali bog'lash"}
        </Button>
      )}
    </AuthCard>
  );
}
