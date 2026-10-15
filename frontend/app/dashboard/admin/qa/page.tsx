"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Eye, EyeOff, MessageCircleQuestion, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useAllQuestions } from "@/lib/queries/qa";
import { cn } from "@/lib/utils";

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
      <CardContent className="flex items-center gap-4 p-5">
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

export default function AdminQaPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: allQuestions } = useAllQuestions();
  const { data: questions, isLoading } = useAllQuestions({
    q: q || undefined,
    unanswered: unansweredOnly,
  });

  const totalQuestions = allQuestions?.length ?? 0;
  const unansweredCount =
    allQuestions?.filter((question) => question.answers.length === 0).length ?? 0;
  const hiddenCount =
    allQuestions?.reduce(
      (sum, question) => sum + question.answers.filter((a) => a.is_hidden).length,
      0
    ) ?? 0;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["qa", "all"] });
  }

  async function toggleHidden(answerId: string) {
    try {
      await apiFetch(`/qa/${answerId}/moderate`, { method: "PATCH" });
      invalidate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/questions/${deleteTarget}`, { method: "DELETE" });
      toast.success("Savol o'chirildi");
      invalidate();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="px-6 py-8">
      <h2 className="font-display text-xl font-bold text-text-primary">Q&amp;A moderatsiya</h2>
      <p className="text-sm text-text-muted">Barcha savol-javoblar, javoblarni yashirish mumkin.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={MessageCircleQuestion} label="Jami savollar" value={totalQuestions} />
        <StatCard icon={Clock} label="Javobsiz savollar" value={unansweredCount} />
        <StatCard icon={EyeOff} label="Yashirilgan javoblar" value={hiddenCount} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Savol matni bo'yicha qidirish"
          className="w-64"
        />
        <button
          type="button"
          onClick={() => setUnansweredOnly((v) => !v)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            unansweredOnly
              ? "bg-primary text-white"
              : "bg-surface-2 text-text-muted hover:text-text-primary"
          )}
        >
          Faqat javobsizlar
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : questions && questions.length > 0 ? (
          questions.map((question) => (
            <Card key={question.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-text-muted">{question.student.full_name} savoli</p>
                    {question.answers.length === 0 && (
                      <Badge variant="warning">Javob kutilmoqda</Badge>
                    )}
                  </div>
                  <p className="font-medium text-text-primary">{question.question_text}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-danger hover:text-danger"
                  onClick={() => setDeleteTarget(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              {question.answers.length > 0 && (
                <CardContent className="space-y-2 border-t border-border pt-4">
                  {question.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="flex items-start justify-between gap-3 rounded-xl bg-surface-2 p-3"
                    >
                      <div>
                        <p className="text-sm text-text-primary">{answer.answer_text}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {answer.user.full_name} ({answer.user.role})
                          {answer.is_hidden && (
                            <Badge variant="destructive" className="ml-2">
                              Yashirilgan
                            </Badge>
                          )}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toggleHidden(answer.id)}>
                        {answer.is_hidden ? (
                          <>
                            <Eye className="h-4 w-4" />
                            Qaytarish
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Yashirish
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-text-muted">
              Hozircha savol-javoblar yo&apos;q.
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Savolni o'chirishni tasdiqlang"
        description="Bu savol va unga berilgan barcha javoblar butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        destructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
