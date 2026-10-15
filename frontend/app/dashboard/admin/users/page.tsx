"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { useAdminUsers } from "@/lib/queries/admin";
import type { UserPublic } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  student: "O'quvchi",
  author: "Muallif",
  admin: "Administrator",
};

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
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>(searchParams.get("role") ?? "all");
  const [page, setPage] = useState(0);
  const [blockTarget, setBlockTarget] = useState<UserPublic | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const { data, isLoading } = useAdminUsers({
    q: q || undefined,
    role: role === "all" ? undefined : role,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  async function handleRoleChange(user: UserPublic, newRole: string) {
    try {
      await apiFetch(`/users/${user.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success("Rol yangilandi");
      invalidate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleConfirmToggleBlock() {
    if (!blockTarget) return;
    setIsBlocking(true);
    try {
      await apiFetch(`/users/${blockTarget.id}/block`, { method: "PATCH" });
      toast.success(blockTarget.is_blocked ? "Blokdan chiqarildi" : "Bloklandi");
      invalidate();
      setBlockTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsBlocking(false);
    }
  }

  return (
    <main className="px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">Foydalanuvchilar</h2>
          <p className="text-sm text-text-muted">Rol berish va bloklash shu yerda amalga oshiriladi.</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Ism yoki email bo'yicha qidirish"
            className="w-64"
          />
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha rollar</SelectItem>
              <SelectItem value="student">O'quvchi</SelectItem>
              <SelectItem value="author">Muallif</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
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
                <TableHead>Ism</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Qo&apos;shilgan sana</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-text-muted">{user.email}</TableCell>
                  <TableCell className="text-text-muted">
                    {new Date(user.created_at).toLocaleDateString("uz-UZ")}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user, value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_blocked ? "destructive" : "success"}>
                      {user.is_blocked ? "Bloklangan" : "Faol"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBlockTarget(user)}
                    >
                      {user.is_blocked ? "Blokdan chiqarish" : "Bloklash"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
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
            <Button
              size="sm"
              variant="outline"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Keyingisi
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blockTarget !== null}
        onOpenChange={(open) => !open && setBlockTarget(null)}
        title={blockTarget?.is_blocked ? "Blokdan chiqarishni tasdiqlang" : "Bloklashni tasdiqlang"}
        description={
          blockTarget?.is_blocked
            ? `${blockTarget?.full_name} blokdan chiqariladi va platformadan qayta foydalana oladi.`
            : `${blockTarget?.full_name} bloklanadi va platformaga kira olmaydi.`
        }
        confirmLabel={blockTarget?.is_blocked ? "Blokdan chiqarish" : "Bloklash"}
        destructive={!blockTarget?.is_blocked}
        isLoading={isBlocking}
        onConfirm={handleConfirmToggleBlock}
      />
    </main>
  );
}
