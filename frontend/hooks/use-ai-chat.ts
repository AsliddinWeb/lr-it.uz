"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AiMessage } from "@/lib/types";

export function useAiChat(initialMessages: AiMessage[] = []) {
  const [messages, setMessages] = useState<AiMessage[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const send = useCallback((lessonId: string, message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setStreamingContent("");
    setIsStreaming(true);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/ai/ask`);
    wsRef.current = ws;
    let accumulated = "";

    ws.onopen = () => {
      ws.send(JSON.stringify({ lesson_id: lessonId, message }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error }]);
        setStreamingContent("");
        setIsStreaming(false);
        ws.close();
        return;
      }

      if (typeof data.delta === "string") {
        accumulated += data.delta;
        setStreamingContent(accumulated);
      }

      if (data.done) {
        setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
        setStreamingContent("");
        setIsStreaming(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      setIsStreaming(false);
    };
  }, []);

  const pushExchange = useCallback((userContent: string, assistantContent: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userContent },
      { role: "assistant", content: assistantContent },
    ]);
  }, []);

  return { messages, streamingContent, isStreaming, send, pushExchange };
}
