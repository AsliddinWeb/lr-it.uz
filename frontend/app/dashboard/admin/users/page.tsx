"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2, UserPlus, UserSearch } from "lucide-react";

import { QueryErrorState } from "@/components/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAdminUsers } from "@/lib/queries/admin";
import { useCurrentUser } from "@/lib/queries/enrollments";
import { ROLE_LABELS } from "@/lib/types";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersPageInner />
    </Suspense>
  );
}

function AdminUsersPageInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>(searchParams.get("role") ?? "all");
  const [page, setPage] = useState(0);
  const { data: me } = useCurrentUser();

  const { data, isLoading, error, refetch } = useAdminUsers({
    q: q || undefined,
    role: role === "all" ? undefined : role,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;
  const isFiltered = q !== "" || role !== "all";

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">Foydalanuvchilar</h2>
          <p className="text-sm text-text-muted">
            Foydalanuvchilarni yarating, tahrirlang, rolini o&apos;zgartiring, bloklang yoki o&apos;chiring.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/dashboard/admin/users/new">
            <UserPlus className="h-4 w-4" />
            Yangi foydalanuvchi
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Ism yoki email bo'yicha qidirish"
          className="sm:w-72"
        />
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha rollar</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {error && !data ? (
          <QueryErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <UserSearch className="h-6 w-6" />
              </span>
              <p className="max-w-sm text-sm text-text-muted">
                {isFiltered
                  ? "Bu shartlarga mos foydalanuvchi topilmadi. Qidiruvni yoki rol filtrini o'zgartirib ko'ring."
                  : "Hali foydalanuvchi yo'q. Birinchi foydalanuvchini yarating."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Qo&apos;shilgan sana</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = me?.id === user.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/admin/users/${user.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {user.full_name}
                        </Link>
                        {isSelf && <span className="ml-2 text-xs font-normal text-text-muted">(siz)</span>}
                      </TableCell>
                      <TableCell className="text-text-muted">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_blocked ? "destructive" : "success"}>
                          {user.is_blocked ? "Bloklangan" : "Faol"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-text-muted">
                        {new Date(user.created_at).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/admin/users/${user.id}`} aria-label={`${user.full_name}ni ko'rish`} title="Ko'rish">
                              <Eye className="h-4 w-4" />
                              <span className="hidden 2xl:inline">Ko&apos;rish</span>
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/dashboard/admin/users/${user.id}/edit`}
                              aria-label={`${user.full_name}ni tahrirlash`}
                              title="Tahrirlash"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="hidden 2xl:inline">Tahrirlash</span>
                            </Link>
                          </Button>
                          {!isSelf && (
                            <Button asChild size="sm" variant="outline" className="text-danger hover:text-danger">
                              <Link
                                href={`/dashboard/admin/users/${user.id}/delete`}
                                aria-label={`${user.full_name}ni o'chirish`}
                                title="O'chirish"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden 2xl:inline">O&apos;chirish</span>
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!isLoading && total > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} ta foydalanuvchi
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Oldingisi
            </Button>
            <Button size="sm" variant="outline" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
              Keyingisi
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
