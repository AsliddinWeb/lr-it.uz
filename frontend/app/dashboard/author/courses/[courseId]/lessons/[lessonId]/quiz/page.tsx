"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError, getErrorMessage } from "@/lib/api";
import { useQuiz } from "@/lib/queries/quiz";
import type { QuizPublic, QuizQuestionAuthorView } from "@/lib/types";

interface DraftQuestion {
  question_text: string;
  options: string[];
  correct_option: number;
}

function emptyQuestion(): DraftQuestion {
  return { question_text: "", options: ["", "", "", ""], correct_option: 0 };
}

function AiGenerateQuestionsButton({ lessonId }: { lessonId: string }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState<QuizQuestionAuthorView[] | null>(null);

  async function handleGenerate() {
    setIsLoading(true);
    setGenerated(null);
    try {
      const quiz = await apiFetch<QuizPublic>(`/lessons/${lessonId}/quiz`);
      const questions = await apiFetch<QuizQuestionAuthorView[]>(
        `/quizzes/${quiz.id}/generate-ai`,
        { method: "POST", body: JSON.stringify({ count: 3 }) }
      );
      setGenerated(questions);
      queryClient.invalidateQueries({ queryKey: ["quiz", lessonId] });
      toast.success(`${questions.length} ta savol qo'shildi`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={handleGenerate} disabled={isLoading}>
        <Sparkles className="h-4 w-4" />
        {isLoading ? "Generatsiya qilinmoqda..." : "AI bilan savol qo'shish"}
      </Button>
      {generated && generated.length > 0 && (
        <div className="space-y-2 rounded-lg bg-surface-2 p-3 text-sm">
          {generated.map((q) => (
            <div key={q.id}>
              <div className="flex items-center gap-2">
                <p className="font-medium text-text-primary">{q.question_text}</p>
                <Badge variant="secondary">AI</Badge>
              </div>
              <ul className="ml-4 list-disc text-text-muted">
                {q.options.map((opt, i) => (
                  <li key={i} className={i === q.correct_option ? "text-success" : undefined}>
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LessonQuizPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const queryClient = useQueryClient();
  const { data: quiz, isLoading, error } = useQuiz(params.lessonId);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, oi) => (oi === oIndex ? value : o)) }
          : q
      )
    );
  }

  const isValid =
    title.trim().length >= 3 &&
    questions.every(
      (q) => q.question_text.trim().length >= 3 && q.options.every((o) => o.trim().length > 0)
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await apiFetch("/quizzes", {
        method: "POST",
        body: JSON.stringify({ lesson_id: params.lessonId, title, questions }),
      });
      queryClient.invalidateQueries({ queryKey: ["quiz", params.lessonId] });
      toast.success("Quiz yaratildi");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <Link
            href={`/dashboard/author/courses/${params.courseId}/curriculum`}
            className="text-sm text-primary hover:underline"
          >
            ← Dastur sahifasiga qaytish
          </Link>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : quiz ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">{quiz.title}</CardTitle>
              <CardDescription>
                Bu mavzu uchun quiz allaqachon mavjud — {quiz.questions.length} ta savol.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {quiz.questions.map((q, i) => (
                  <li key={q.id} className="rounded-xl border border-border p-3 text-sm">
                    <p className="font-medium text-text-primary">
                      {i + 1}. {q.question_text}
                    </p>
                    <ul className="ml-4 mt-1 list-disc text-text-muted">
                      {q.options.map((opt, oi) => (
                        <li key={oi}>{opt}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <AiGenerateQuestionsButton lessonId={params.lessonId} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Quiz yaratish</CardTitle>
              <CardDescription>
                {error instanceof ApiError && error.status !== 404
                  ? error.message
                  : "Bu mavzu uchun hali quiz yo'q — yangi quiz yarating."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Quiz sarlavhasi"
                />

                {questions.map((question, qIndex) => (
                  <div key={qIndex} className="space-y-2 rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">{qIndex + 1}-savol</p>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIndex))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={question.question_text}
                      onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
                      placeholder="Savol matni"
                    />
                    <RadioGroup
                      value={question.correct_option.toString()}
                      onValueChange={(v) => updateQuestion(qIndex, { correct_option: Number(v) })}
                    >
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`${oIndex + 1}-variant`}
                          />
                        </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-text-muted">To&apos;g'ri javobni radio orqali belgilang.</p>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
                  >
                    <Plus className="h-4 w-4" />
                    Savol qo&apos;shish
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? "Saqlanmoqda..." : "Quizni yaratish"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
