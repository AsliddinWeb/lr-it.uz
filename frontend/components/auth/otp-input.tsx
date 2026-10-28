"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const LENGTH = 6;

/**
 * 6 xonali kod maydoni. Ichida bitta haqiqiy <input> bor (shuning uchun joylashtirish va
 * telefon/brauzer "bir martalik kod" avtoto'ldirishi ishlaydi), qutilar faqat ko'rinish uchun.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  autoFocus = true,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, LENGTH);
    onChange(digits);
    if (digits.length === LENGTH) onComplete?.(digits);
  }

  const active = Math.min(value.length, LENGTH - 1);

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        pattern="\d*"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        disabled={disabled}
        aria-label="6 xonali tasdiqlash kodi"
        aria-invalid={invalid || undefined}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />
      <div className="flex justify-between gap-2" aria-hidden="true">
        {Array.from({ length: LENGTH }, (_, i) => {
          const char = value[i] ?? "";
          const isActive = focused && !disabled && i === active;
          return (
            <div
              key={i}
              className={cn(
                "flex h-12 w-full max-w-[3.25rem] items-center justify-center rounded-xl border bg-surface font-display text-xl font-bold tabular-nums text-text-primary transition-colors",
                invalid ? "border-danger" : isActive ? "border-primary ring-2 ring-primary/30" : "border-border",
                disabled && "opacity-60"
              )}
            >
              {char}
              {isActive && !char && <span className="h-5 w-px animate-pulse bg-primary" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
