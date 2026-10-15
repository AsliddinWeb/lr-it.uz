"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, BookOpen, ClipboardList, GraduationCap, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { useAuthorOverview } from "@/lib/queries/author";

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

export default function AuthorDashboardPage() {
  const { data, isLoading, error, refetch } = useAuthorOverview();

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Jami kurslar" value={data.total_courses} />
        <StatCard icon={Layers} label="Faol kurslar" value={data.active_courses} />
        <StatCard icon={ClipboardList} label="Kutilayotgan so'rovlar" value={data.pending_enrollments} />
        <StatCard icon={GraduationCap} label="Jami o'quvchilar" value={data.total_students} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Haftalik faollik</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
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
              <Link href="/dashboard/author/courses">
                Mening kurslarim
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/author/enrollments">
                So'rovlar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="justify-between">
              <Link href="/dashboard/author/courses/new">
                Yangi kurs yaratish
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
