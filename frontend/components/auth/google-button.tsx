"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface GoogleIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    auto_select?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // keyingi urinishda qayta yuklanadi
      reject(new Error("Google skripti yuklanmadi"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Rasmiy "Google bilan kirish" tugmasi (Google Identity Services). */
export function GoogleButton({
  clientId,
  onCredential,
  text,
}: {
  clientId: string;
  onCredential: (credential: string) => void;
  text: "signin_with" | "signup_with" | "continue_with";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const { resolvedTheme } = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) callbackRef.current(response.credential);
          },
          auto_select: false,
          itp_support: true,
        });
        container.innerHTML = "";
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: resolvedTheme === "dark" ? "filled_black" : "outline",
          size: "large",
          text,
          shape: "rectangular",
          logo_alignment: "left",
          locale: "uz",
          // Google tugmasi 200–400 px oralig'ida bo'ladi.
          width: Math.min(400, Math.max(200, Math.floor(container.clientWidth))),
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [clientId, resolvedTheme, text]);

  return (
    <div>
      <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />
      {failed && (
        <p className="mt-2 text-center text-xs text-text-muted">
          Google yuklanmadi. Internet yoki reklama bloklagichni tekshiring, yoki email bilan kiring.
        </p>
      )}
    </div>
  );
}
