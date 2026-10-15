"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CodeRunResult } from "@/lib/types";

type Output = CodeRunResult | { error: string };

export function useCodeRun() {
  const [output, setOutput] = useState<Output | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const run = useCallback((lessonId: string, code: string) => {
    setIsRunning(true);
    setOutput(null);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/code/run`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ lesson_id: lessonId, code }));
    };

    ws.onmessage = (event) => {
      setOutput(JSON.parse(event.data));
      setIsRunning(false);
      ws.close();
    };

    ws.onerror = () => {
      setOutput({ error: "Ulanishda xatolik yuz berdi" });
      setIsRunning(false);
    };

    ws.onclose = (event) => {
      setIsRunning(false);
      if (event.code === 4401 || event.code === 4403) {
        setOutput({ error: "Tizimga qayta kiring" });
      }
    };
  }, []);

  return { run, output, isRunning };
}
