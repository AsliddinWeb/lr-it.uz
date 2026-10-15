"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useCourses } from "@/lib/queries/courses";
import {
  LEVEL_LABELS,
  TRACK_LABELS,
  type CourseListItem,
  type CourseStatus,
  type CourseTrack,
  type CourseLevel,
} from "@/lib/types";

const STATUS_LABELS: Record<CourseStatus, string> = {
  qoralama: "Qoralama",
  kutilmoqda: "Kutilmoqda",
  faol: "Faol",
  arxiv: "Arxiv",
};

const STATUS_VARIANT: Record<CourseStatus, "secondary" | "warning" | "success" | "outline"> = {
  qoralama: "secondary",
  kutilmoqda: "warning",
  faol: "success",
  arxiv: "outline",
};

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: courses, isLoading } = useCourses({
    track: track === "all" ? undefined : (track as CourseTrack),
    level: level === "all" ? undefined : (level as CourseLevel),
    status: status === "all" ? undefined : (status as CourseStatus),
  });

  const filteredCourses = useMemo(() => {
    if (!courses) return courses;
    if (!q.trim()) return courses;
    const pattern = q.trim().toLowerCase();
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(pattern) ||
        course.authors.some((a) => a.full_name.toLowerCase().includes(pattern))
    );
  }, [courses, q]);

  async function updateStatus(course: CourseListItem, newStatus: CourseStatus) {
    try {
      await apiFetch(`/courses/${course.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Kurs holati yangilandi");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <main className="px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">Kurslarni boshqarish</h2>
          <p className="text-sm text-text-muted">Barcha kurslar, istalgan holatda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sarlavha yoki muallif bo'yicha"
            className="w-56"
          />
          <Select value={track} onValueChange={setTrack}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha yo&apos;nalishlar</SelectItem>
              <SelectItem value="savodxonlik">Savodxonlik</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha darajalar</SelectItem>
              <SelectItem value="boshlangich">Boshlang&apos;ich</SelectItem>
              <SelectItem value="orta">O&apos;rta</SelectItem>
              <SelectItem value="yuqori">Yuqori</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sarlavha</TableHead>
                <TableHead>Muallif</TableHead>
                <TableHead>Yo&apos;nalish / Daraja</TableHead>
                <TableHead>Qo&apos;shilgan sana</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/courses/${course.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline"
                    >
                      {course.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {course.authors.map((a) => a.full_name).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {TRACK_LABELS[course.track]} · {LEVEL_LABELS[course.level]}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {new Date(course.created_at).toLocaleDateString("uz-UZ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[course.status]}>
                      {STATUS_LABELS[course.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {course.status !== "faol" && (
                      <Button size="sm" onClick={() => updateStatus(course, "faol")}>
                        Tasdiqlash
                      </Button>
                    )}
                    {course.status !== "arxiv" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(course, "arxiv")}
                      >
                        Arxivlash
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
}
