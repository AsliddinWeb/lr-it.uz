"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useAdminQuizDetail, useAdminQuizzes } from "@/lib/queries/admin-quizzes";
import type { AdminQuizQuestionDetail } from "@/lib/types";

function invalidateQuizzes(queryClient: ReturnType<typeof useQueryClient>, quizId: string) {
  queryClient.invalidateQueries({ queryKey: ["admin", "quizzes"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "quizzes", quizId] });
}

function QuestionEditor({
  quizId,
  question,
}: {
  quizId: string;
  question: AdminQuizQuestionDetail;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(question.question_text);
  const [options, setOptions] = useState(question.options);
  const [correct, setCorrect] = useState(question.correct_option);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrect((prevCorrect) => {
      if (prevCorrect === index) return 0;
      if (prevCorrect > index) return prevCorrect - 1;
      return prevCorrect;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await apiFetch(`/admin/quiz-questions/${question.id}`, {
        method: "PATCH",
        body: JSON.stringify({ question_text: text, options, correct_option: correct }),
      });
      toast.success("Savol yangilandi");
      invalidateQuizzes(queryClient, quizId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await apiFetch(`/admin/quiz-questions/${question.id}`, { method: "DELETE" });
      toast.success("Savol o'chirildi");
      invalidateQuizzes(queryClient, quizId);
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl bg-surface-2 p-3">
      <Input value={text} onChange={(e) => setText(e.target.value)} />
      <RadioGroup
        value={correct.toString()}
        onValueChange={(v) => setCorrect(Number(v))}
        className="gap-2"
      >
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <RadioGroupItem value={index.toString()} id={`${question.id}-opt-${index}`} />
            <Input
              value={option}
              onChange={(e) => {
                const next = [...options];
                next[index] = e.target.value;
                setOptions(next);
              }}
            />
            {options.length > 2 && (
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-danger hover:text-danger"
                onClick={() => removeOption(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </RadioGroup>
      <Button size="sm" variant="outline" onClick={addOption}>
        <Plus className="h-4 w-4" />
        Variant qo&apos;shish
      </Button>
      <div className="flex gap-2">
        <Button size="sm" disabled={isSaving} onClick={handleSave}>
          Saqlash
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 className="h-4 w-4" />
          O&apos;chirish
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Savolni o'chirishni tasdiqlang"
        description="Bu quiz savoli butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        destructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function QuizCard({ quizId, title, courseTitle, lessonTitle, questionCount }: {
  quizId: string;
  title: string;
  courseTitle: string;
  lessonTitle: string;
  questionCount: number;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const { data: detail, isLoading } = useAdminQuizDetail(expanded ? quizId : null);

  async function handleSaveTitle() {
    setIsSavingTitle(true);
    try {
      await apiFetch(`/admin/quizzes/${quizId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: titleValue }),
      });
      toast.success("Sarlavha yangilandi");
      invalidateQuizzes(queryClient, quizId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingTitle(false);
    }
  }

  return (
    <Card>
      <CardHeader
        className="flex-row cursor-pointer items-center justify-between space-y-0"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <p className="font-display text-lg font-bold text-text-primary">{title}</p>
          <p className="text-sm text-text-muted">
            {courseTitle} · {lessonTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{questionCount} savol</Badge>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 border-t border-border pt-4">
          <div className="flex gap-2">
            <Input value={titleValue} onChange={(e) => setTitleValue(e.target.value)} />
            <Button size="sm" disabled={isSavingTitle} onClick={handleSaveTitle}>
              Sarlavhani saqlash
            </Button>
          </div>
          {isLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : (
            detail?.questions.map((question) => (
              <QuestionEditor key={question.id} quizId={quizId} question={question} />
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function AdminQuizzesPage() {
  const { data: quizzes, isLoading } = useAdminQuizzes();
  const [q, setQ] = useState("");

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return quizzes;
    if (!q.trim()) return quizzes;
    const pattern = q.trim().toLowerCase();
    return quizzes.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(pattern) ||
        quiz.course_title.toLowerCase().includes(pattern) ||
        quiz.lesson_title.toLowerCase().includes(pattern)
    );
  }, [quizzes, q]);

  return (
    <main className="px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">Quiz banki</h2>
          <p className="text-sm text-text-muted">
            Barcha quizlar, savollarni tahrirlash yoki o&apos;chirish mumkin.
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kurs yoki mavzu bo'yicha qidirish"
          className="w-64"
        />
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : filteredQuizzes && filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quizId={quiz.id}
              title={quiz.title}
              courseTitle={quiz.course_title}
              lessonTitle={quiz.lesson_title}
              questionCount={quiz.question_count}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-text-muted">
              Hozircha quizlar yo&apos;q. Mualliflar mavzularga quiz qo&apos;shganda, ular shu yerda ko&apos;rinadi.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
