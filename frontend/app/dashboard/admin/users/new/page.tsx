"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { UserForm, type CreateUserValues } from "@/components/admin/user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, getErrorMessage } from "@/lib/api";
import type { UserPublic } from "@/lib/types";

export default function AdminNewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: CreateUserValues) {
    setIsSubmitting(true);
    try {
      const user = await apiFetch<UserPublic>("/users", {
        method: "POST",
        body: JSON.stringify(values),
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`${user.full_name} yaratildi`);
      router.push(`/dashboard/admin/users/${user.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/dashboard/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Foydalanuvchilar
      </Link>

      <Card className="mt-4 max-w-xl">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <UserPlus className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="font-display text-lg">Yangi foydalanuvchi</CardTitle>
            <p className="mt-1 text-sm text-text-muted">
              Hisob darhol yaratiladi, ro&apos;yxatdan o&apos;tish va email kodi talab qilinmaydi.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <UserForm
            mode="create"
            isSubmitting={isSubmitting}
            cancelHref="/dashboard/admin/users"
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </main>
  );
}
