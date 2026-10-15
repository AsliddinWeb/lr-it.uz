"use client";

import Link from "next/link";
import { GraduationCap, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers } from "@/lib/queries/admin";

const ROLES = [
  {
    role: "student",
    icon: Users,
    title: "O'quvchi (student)",
    description:
      "Kurslarga yozilish, darslarni o'qish, kod yozish, quizlar topshirish, sertifikat olish.",
  },
  {
    role: "author",
    icon: GraduationCap,
    title: "Muallif (author)",
    description:
      "Kurs yaratish va tahrirlash, so'rovlarni ko'rib chiqish, o'quvchilar ro'yxati va statistikasini ko'rish.",
  },
  {
    role: "admin",
    icon: ShieldCheck,
    title: "Administrator (admin)",
    description:
      "Barcha huquqlar: foydalanuvchilarni boshqarish, kurslarni tasdiqlash, Q&A moderatsiya, sayt kontenti va bildirishnomalar.",
  },
];

export default function AdminRolesPage() {
  const { data: studentData, isLoading: studentLoading } = useAdminUsers({ role: "student", limit: 1 });
  const { data: authorData, isLoading: authorLoading } = useAdminUsers({ role: "author", limit: 1 });
  const { data: adminData, isLoading: adminLoading } = useAdminUsers({ role: "admin", limit: 1 });

  const counts: Record<string, { total: number; isLoading: boolean }> = {
    student: { total: studentData?.total ?? 0, isLoading: studentLoading },
    author: { total: authorData?.total ?? 0, isLoading: authorLoading },
    admin: { total: adminData?.total ?? 0, isLoading: adminLoading },
  };

  return (
    <main className="px-6 py-8">
      <h2 className="font-display text-xl font-bold text-text-primary">Rol va huquqlar</h2>
      <p className="text-sm text-text-muted">
        Platformada 3 ta rol mavjud. Foydalanuvchining rolini o&apos;zgartirish uchun{" "}
        <Link href="/dashboard/admin/users" className="text-primary hover:underline">
          Foydalanuvchilar
        </Link>{" "}
        sahifasidan foydalaning.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {ROLES.map(({ role, icon: Icon, title, description }) => (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                {counts[role].isLoading ? (
                  <Skeleton className="h-6 w-10 rounded-full" />
                ) : (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-text-primary">
                    {counts[role].total} ta
                  </span>
                )}
              </div>
              <CardTitle className="mt-3 font-display text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-text-muted">{description}</p>
              <Button asChild size="sm" variant="outline" className="w-full justify-center">
                <Link href={`/dashboard/admin/users?role=${role}`}>Ro&apos;yxatni ko&apos;rish</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
