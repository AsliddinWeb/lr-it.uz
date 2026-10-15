"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircleQuestion } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useLessonQuestions } from "@/lib/queries/qa";

export function QaPanel({ lessonId }: { lessonId: string }) {
  const queryClient = useQueryClient();
  const { data: questions, isLoading } = useLessonQuestions(lessonId);
  const [newQuestion, setNewQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["qa", "lesson", lessonId] });
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setIsAsking(true);
    try {
      await apiFetch(`/lessons/${lessonId}/questions`, {
        method: "POST",
        body: JSON.stringify({ question_text: newQuestion }),
      });
      setNewQuestion("");
      invalidate();
      toast.success("Savolingiz yuborildi");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsAsking(false);
    }
  }

  async function handleAnswer(questionId: string) {
    const text = answerDrafts[questionId];
    if (!text?.trim()) return;
    setIsAnswering(true);
    try {
      await apiFetch(`/questions/${questionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ answer_text: text }),
      });
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
      setAnsweringId(null);
      invalidate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsAnswering(false);
    }
  }

  if (isLoading) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <MessageCircleQuestion className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <CardTitle className="font-display text-base">Savol-javob</CardTitle>
          <p className="text-xs text-text-muted">
            {questions?.length ?? 0} ta savol
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAsk} className="space-y-2">
          <Textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Savolingizni yozing..."
            rows={2}
          />
          <Button type="submit" size="sm" disabled={isAsking} className="w-full">
            Yuborish
          </Button>
        </form>

        {questions && questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                    {question.student.full_name.charAt(0).toUpperCase()}
                  </span>
                  <p className="text-sm font-medium text-text-primary">
                    {question.student.full_name}
                  </p>
                </div>
                <p className="mt-1.5 text-sm text-text-primary">{question.question_text}</p>

                {question.answers.filter((a) => !a.is_hidden).length > 0 && (
                  <div className="mt-2 space-y-1.5 border-l-2 border-border pl-3">
                    {question.answers
                      .filter((a) => !a.is_hidden)
                      .map((answer) => (
                        <p key={answer.id} className="text-sm">
                          <span className="font-medium text-text-primary">
                            {answer.user.full_name}:{" "}
                          </span>
                          <span className="text-text-muted">{answer.answer_text}</span>
                        </p>
                      ))}
                  </div>
                )}

                {answeringId === question.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      rows={2}
                      value={answerDrafts[question.id] ?? ""}
                      onChange={(e) =>
                        setAnswerDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))
                      }
                      placeholder="Javob yozing..."
                    />
                    <Button
                      size="sm"
                      disabled={isAnswering}
                      onClick={() => handleAnswer(question.id)}
                      className="w-full"
                    >
                      Yuborish
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1"
                    onClick={() => setAnsweringId(question.id)}
                  >
                    Javob yozish
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            Hali savollar yo&apos;q. Birinchi bo&apos;lib so&apos;rang!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
