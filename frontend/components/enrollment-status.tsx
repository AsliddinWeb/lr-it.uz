import { Check, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EnrollmentStatus } from "@/lib/types";

const STEPS: { key: EnrollmentStatus; label: string }[] = [
  { key: "kutilmoqda", label: "Kutilmoqda" },
  { key: "tasdiqlangan", label: "Tasdiqlangan" },
];

function StepIcon({ active, isRejected }: { active: boolean; isRejected: boolean }) {
  if (isRejected) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/10 text-danger">
        <X className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full",
        active ? "bg-success/10 text-success" : "bg-surface-2 text-text-muted"
      )}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
    </span>
  );
}

export function EnrollmentStatusTimeline({ status }: { status: EnrollmentStatus }) {
  if (status === "rad_etilgan") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <StepIcon active={false} isRejected />
        <span className="font-medium text-danger">Rad etilgan</span>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {STEPS.map((step, index) => {
        const active =
          status === step.key || (step.key === "kutilmoqda" && status === "tasdiqlangan");
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <StepIcon active={active} isRejected={false} />
              <span
                className={cn(
                  "text-sm",
                  active ? "font-medium text-text-primary" : "text-text-muted"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-6",
                  status === "tasdiqlangan" ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
