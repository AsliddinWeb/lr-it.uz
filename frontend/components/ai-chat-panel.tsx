"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useConversationHistory } from "@/lib/queries/ai";
import { cn } from "@/lib/utils";

export function AiChatPanel({ lessonId, code }: { lessonId: string; code?: string }) {
  const { data: history } = useConversationHistory(lessonId);
  const { messages, streamingContent, isStreaming, send, pushExchange } = useAiChat(
    history?.messages ?? []
  );
  const [input, setInput] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingContent]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    send(lessonId, input.trim());
    setInput("");
  }

  async function handleReviewCode() {
    if (!code?.trim()) {
      toast.error("Avval kod yozing");
      return;
    }
    setIsReviewing(true);
    try {
      const res = await apiFetch<{ explanation: string }>("/ai/review-code", {
        method: "POST",
        body: JSON.stringify({ lesson_id: lessonId, code }),
      });
      pushExchange(`[Kod tahlili so'rovi]\n${code}`, res.explanation);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <div
      className="flex h-[360px] flex-col overflow-hidden rounded-2xl border shadow-sm"
      style={{ backgroundColor: "var(--dark-bg)", borderColor: "var(--dark-border)" }}
    >
      <div
        className="flex shrink-0 items-center justify-between border-b px-5 py-4"
        style={{ borderColor: "var(--dark-border)" }}
      >
        <span
          className="flex items-center gap-2 font-display text-lg font-semibold"
          style={{ color: "var(--dark-text)" }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          AI-yordamchi
        </span>
        {code !== undefined && (
          <Button size="sm" variant="outline" onClick={handleReviewCode} disabled={isReviewing}>
            {isReviewing ? "Tahlil qilinmoqda..." : "Kodni tahlil qildirish"}
          </Button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-primary"
                style={{ backgroundColor: "var(--dark-surface)" }}
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="text-sm" style={{ color: "var(--dark-text-muted)" }}>
                Mavzu bo&apos;yicha savolingiz bo&apos;lsa, shu yerga yozing.
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn("max-w-[85%] rounded-xl px-3 py-2 text-sm", m.role === "user" && "ml-auto")}
                style={
                  m.role === "user"
                    ? { backgroundColor: "var(--primary)", color: "#ffffff" }
                    : { backgroundColor: "var(--dark-surface)", color: "var(--dark-text)" }
                }
              >
                {m.content}
              </div>
            ))
          )}
          {streamingContent && (
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--dark-surface)", color: "var(--dark-text)" }}
            >
              {streamingContent}
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Savolingizni yozing..."
            disabled={isStreaming}
            className="border-0"
            style={{ backgroundColor: "var(--dark-surface)", color: "var(--dark-text)" }}
          />
          <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
