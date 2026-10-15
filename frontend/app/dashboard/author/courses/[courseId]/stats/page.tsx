"use client";

import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Star, Users } from "lucide-react";

import { RadialProgress } from "@/components/radial-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query-error-state";
import { useCourse } from "@/lib/queries/courses";
import { useCourseStats } from "@/lib/queries/author";

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
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

export default function CourseStatsPage() {
  const params = useParams<{ courseId: string }>();
  const { data: course } = useCourse(params.courseId);
  const { data: stats, isLoading, error, refetch } = useCourseStats(params.courseId);

  if (error && !stats) {
    return (
      <main className="px-6 py-8">
        <QueryErrorState error={error} onRetry={() => refetch()} />
      </main>
    );
  }

  if (isLoading || !stats) {
    return (
      <main className="px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-8">
      <h2 className="font-display text-xl font-bold text-text-primary">
        Statistika {course ? `— ${course.title}` : ""}
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard icon={Users} label="Jami o'quvchilar" value={stats.total_students} />
        <StatCard icon={Star} label="O'rtacha quiz bahosi" value={stats.average_quiz_score} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Haftalik faollik</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activity_last_7_days}>
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

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Tugatish foizi</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <RadialProgress value={stats.completion_rate} label="tugatilgan" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
