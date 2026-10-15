"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";

import { RadialProgress } from "@/components/radial-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { useAnalyticsOverview } from "@/lib/queries/admin";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-sm text-text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAnalyticsOverview();

  if (error && !data) {
    return (
      <main className="px-6 py-8">
        <QueryErrorState error={error} onRetry={() => refetch()} />
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Jami o'quvchilar" value={data.total_students} />
        <StatCard icon={GraduationCap} label="Jami mualliflar" value={data.total_authors} />
        <StatCard icon={ShieldCheck} label="Jami adminlar" value={data.total_admins} />
        <StatCard icon={Layers} label="Jami kurslar" value={data.total_courses} />
        <StatCard icon={BookOpen} label="Faol kurslar" value={data.active_courses} />
        <StatCard icon={ClipboardList} label="Kutilayotgan so'rovlar" value={data.pending_enrollments} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Ro&apos;yxatdan o&apos;tishlar (30 kun)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.signups_last_30_days}>
                <CartesianGrid stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval={4}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Kurs tugatish foizi</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <RadialProgress value={data.completion_rate} label="tugatilgan" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Haftalik faollik</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activity_last_7_days}>
                <CartesianGrid stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="font-display text-lg">Tezkor havolalar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-end gap-2">
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/admin/users">
                Foydalanuvchilar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/admin/courses">
                Kurslar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/admin/enrollments">
                So&apos;rovlar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/admin/qa">
                Q&amp;A moderatsiya
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="justify-between">
              <Link href="/dashboard/admin/broadcast">
                Bildirishnoma yuborish
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
