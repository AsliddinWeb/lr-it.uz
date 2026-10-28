"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { UserCog } from "lucide-react";
import { toast } from "sonner";

import { BackToUsers, UserLoadError, UserPageSkeleton } from "@/components/admin/user-page-state";
import { UserForm, type EditUserValues } from "@/components/admin/user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useAdminUser } from "@/lib/queries/admin";
import { useCurrentUser } from "@/lib/queries/enrollments";
import type { UserPublic } from "@/lib/types";

export default function AdminEditUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error, refetch } = useAdminUser(userId);
  const { data: me } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) return <UserPageSkeleton />;
  if (!user) return <UserLoadError error={error} onRetry={() => refetch()} />;

  const isSelf = me?.id === user.id;
  const detailHref = `/dashboard/admin/users/${user.id}`;

  async function handleSubmit(values: EditUserValues) {
    if (!user) return;
    setIsSubmitting(true);

    // Faqat o'zgargan maydonlar yuboriladi; o'z hisobingizda rol va holat umuman yuborilmaydi.
    const payload: Record<string, unknown> = {};
    if (values.full_name !== user.full_name) payload.full_name = values.full_name;
    if (values.email !== user.email) payload.email = values.email;
    if (!isSelf && values.role !== user.role) payload.role = values.role;
    if (!isSelf && (values.status === "blocked") !== user.is_blocked) {
      payload.is_blocked = values.status === "blocked";
    }
    if (values.is_email_verified !== user.is_email_verified) {
      payload.is_email_verified = values.is_email_verified;
    }
    if (values.password) payload.password = values.password;

    if (Object.keys(payload).length === 0) {
      toast.info("O'zgarish kiritilmadi");
      setIsSubmitting(false);
      return;
    }

    try {
      await apiFetch<UserPublic>(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "user", user.id] }),
        isSelf ? queryClient.invalidateQueries({ queryKey: ["auth", "me"] }) : Promise.resolve(),
      ]);
      toast.success("Foydalanuvchi ma'lumotlari saqlandi");
      router.push(detailHref);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <BackToUsers />

      <Card className="mt-4 max-w-xl">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <UserCog className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <CardTitle className="font-display text-lg">Foydalanuvchini tahrirlash</CardTitle>
            <p className="mt-1 truncate text-sm text-text-muted">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <UserForm
            mode="edit"
            isSelf={isSelf}
            isSubmitting={isSubmitting}
            cancelHref={detailHref}
            defaultValues={{
              full_name: user.full_name,
              email: user.email,
              role: user.role,
              status: user.is_blocked ? "blocked" : "active",
              is_email_verified: user.is_email_verified,
            }}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </main>
  );
}
