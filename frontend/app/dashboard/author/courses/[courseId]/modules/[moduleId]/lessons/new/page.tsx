"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";

type LanguageOption = "none" | "python" | "cpp";

export default function NewLessonPage() {
  const params = useParams<{ courseId: string; moduleId: string }>();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState("");
  const [contentMd, setContentMd] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [language, setLanguage] = useState<LanguageOption>("none");
  const [starterCode, setStarterCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/modules/${params.moduleId}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          title,
          content_md: contentMd,
          video_url: videoUrl.trim() || null,
          language: language === "none" ? null : language,
          starter_code: language === "none" ? null : starterCode,
        }),
      });
      toast.success("Mavzu qo'shildi");
      router.push(`/dashboard/author/courses/${params.courseId}/curriculum`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Yangi mavzu qo&apos;shish</CardTitle>
            <CardDescription>
              Mavzu matnini kiriting, ixtiyoriy ravishda video va kod mashqi biriktiring. Fayl
              resurslarini mavzu saqlangandan keyin, tahrirlash sahifasida qo&apos;shishingiz mumkin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Mavzu sarlavhasi</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: O'zgaruvchilar"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label>Mavzu matni</Label>
                <Textarea
                  value={contentMd}
                  onChange={(e) => setContentMd(e.target.value)}
                  placeholder="Mavzu tushuntirishini yozing (Markdown qo'llab-quvvatlanadi)"
                  rows={6}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Video havolasi (YouTube/Vimeo, ixtiyoriy)</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Kod mashqi tili</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as LanguageOption)}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yo'q — faqat matn</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {language !== "none" && (
                <div className="space-y-1.5">
                  <Label>Boshlang&apos;ich kod</Label>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <Editor
                      height="240px"
                      language={language}
                      value={starterCode}
                      onChange={(value) => setStarterCode(value ?? "")}
                      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                      options={{ fontSize: 14, minimap: { enabled: false } }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || title.trim().length < 2}>
                  {isSubmitting ? "Saqlanmoqda..." : "Mavzuni saqlash"}
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/dashboard/author/courses/${params.courseId}/curriculum`}>
                    Bekor qilish
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
