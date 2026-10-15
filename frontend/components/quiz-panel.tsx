"use client";

import { useState } from "react";
import { CheckCircle2, ListChecks, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useQuiz } from "@/lib/queries/quiz";
import type { QuizAttemptResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuizPanel({ lessonId }: { lessonId: string }) {
  const { data: quiz, isLoading, error } = useQuiz(lessonId);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || error || !quiz) {
    return null;
  }

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);

  async function handleSubmit() {
    if (!quiz) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch<QuizAttemptResult>(`/quizzes/${quiz.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setResult(res);
      toast.success(`Natija: ${res.score}/${res.total} (+${res.xp_awarded} XP)`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ListChecks className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <CardTitle className="truncate font-display text-base">{quiz.title}</CardTitle>
          <p className="text-xs text-text-muted">{quiz.questions.length} ta savol</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {quiz.questions.map((question, qIndex) => (
          <div key={question.id}>
            <p className="mb-2 text-sm font-medium text-text-primary">
              {qIndex + 1}. {question.question_text}
            </p>
            <div className="space-y-1.5">
              {question.options.map((option, oIndex) => {
                const isSelected = answers[question.id] === oIndex;
                const isCorrect = result?.correct_question_ids.includes(question.id);
                return (
                  <button
                    key={oIndex}
                    type="button"
                    disabled={result !== null}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [question.id]: oIndex }))
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                      !result && isSelected && "border-primary bg-primary-soft text-primary",
                      !result && !isSelected && "border-border hover:bg-surface-2",
                      result && isSelected && isCorrect && "border-success bg-success/10 text-success",
                      result && isSelected && !isCorrect && "border-danger bg-danger/10 text-danger",
                      result && !isSelected && "border-border text-text-muted"
                    )}
                  >
                    {result && isSelected ? (
                      isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0" />
                      )
                    ) : (
                      <span
                        className={cn(
                          "h-4 w-4 shrink-0 rounded-full border",
                          isSelected ? "border-primary bg-primary" : "border-border"
                        )}
                      />
                    )}
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {!result ? (
          <Button onClick={handleSubmit} disabled={isSubmitting || !allAnswered} className="w-full">
            {isSubmitting ? "Yuborilmoqda..." : "Javoblarni topshirish"}
          </Button>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-primary-soft px-4 py-3">
            <span className="text-sm font-semibold text-primary">
              Natija: {result.score}/{result.total}
            </span>
            <span className="text-sm font-medium text-primary">+{result.xp_awarded} XP</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
