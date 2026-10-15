"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useCurrentUser } from "@/lib/queries/enrollments";

export function ProfileEditForm({ backHref }: { backHref: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) setFullName(user.full_name);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2) return;
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName }),
      });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profil saqlandi");
      router.push(backHref);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !user) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-xl">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Profilni tahrirlash</CardTitle>
            <CardDescription>Ism-familiyangizni yangilang.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Ism-familiya</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || fullName.trim().length < 2}>
                  {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
                <Button asChild variant="ghost">
                  <Link href={backHref}>Bekor qilish</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
