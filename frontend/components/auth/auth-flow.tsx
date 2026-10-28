"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
  ForgotForm,
  FormBanner,
  LoginForm,
  RegisterForm,
  ResetForm,
  VerifyForm,
  type Banner,
} from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { ApiError, apiFetch, getErrorMessage } from "@/lib/api";
import { useAuthProviders } from "@/lib/queries/auth";
import type { UserPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "login" | "register" | "verify" | "forgot" | "reset";
const VIEWS: View[] = ["login", "register", "verify", "forgot", "reset"];

const ROLE_REDIRECT: Record<string, string> = {
  student: "/dashboard/student",
  author: "/dashboard/author",
  admin: "/dashboard/admin",
};

interface CodeResponse {
  message: string;
  email?: string;
  resend_in?: number;
  /** Faqat lokal ishlab chiqishda (SMTP sozlanmagan). */
  debug_code?: string;
}

/** `next` faqat sayt ichidagi yo'l bo'lsa va foydalanuvchi roliga mos bo'lsagina ishlatiladi. */
function safeNext(next: string | null, role: string): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  if (next.startsWith("/dashboard") && !next.startsWith(ROLE_REDIRECT[role] ?? "/dashboard/none")) return null;
  return next;
}

export function AuthFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();

  const next = params.get("next");
  const initialEmail = params.get("email") ?? "";
  const [view, setView] = useState<View>(() => {
    const mode = params.get("mode") as View | null;
    if (!mode || !VIEWS.includes(mode)) return "login";
    if ((mode === "verify" || mode === "reset") && !initialEmail) return "login";
    return mode;
  });
  const [email, setEmail] = useState(initialEmail);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const { data: providers } = useAuthProviders();
  const googleClientId = providers?.google_client_id ?? null;
  const emailDisabled = providers ? !providers.email_enabled : false;

  const destination = useCallback(
    (role: string) => safeNext(next, role) ?? ROLE_REDIRECT[role] ?? "/",
    [next]
  );

  // Allaqachon kirgan foydalanuvchi bu sahifada qolmasin. Alohida kalit: eski keshni ishlatmaymiz.
  const { data: session } = useQuery({
    queryKey: ["auth", "session-check"],
    queryFn: () => apiFetch<UserPublic>("/auth/me"),
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });
  useEffect(() => {
    if (session) router.replace(destination(session.role));
  }, [session, router, destination]);

  // "Qayta yuborish" sanagichi.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const go = useCallback(
    (to: View, opts: { email?: string; banner?: Banner | null } = {}) => {
      const targetEmail = opts.email ?? email;
      setView(to);
      setBanner(opts.banner ?? null);
      if (opts.email !== undefined) setEmail(opts.email);
      if (to !== "verify" && to !== "reset") {
        setDebugCode(null);
        setResendIn(0);
      }
      const query = new URLSearchParams({ mode: to });
      if ((to === "verify" || to === "reset") && targetEmail) query.set("email", targetEmail);
      if (next) query.set("next", next);
      router.replace(`/auth?${query.toString()}`, { scroll: false });
    },
    [email, next, router]
  );

  function finishAuth(user: UserPublic) {
    queryClient.setQueryData(["auth", "me"], user);
    toast.success("Xush kelibsiz!");
    router.replace(destination(user.role));
    // `busy` ataylab o'chirilmaydi: sahifa almashguncha tugmalar bosilmasin.
  }

  /** Kod so'raydi: "sent" (yuborildi), "throttled" (yaqinda yuborilgan, kod amal qiladi) yoki "failed". */
  async function requestCode(
    kind: "resend" | "forgot",
    targetEmail: string
  ): Promise<"sent" | "throttled" | "failed"> {
    const path = kind === "resend" ? "/auth/resend-code" : "/auth/forgot-password";
    try {
      const res = await apiFetch<CodeResponse>(path, {
        method: "POST",
        body: JSON.stringify({ email: targetEmail }),
      });
      setResendIn(res.resend_in ?? 60);
      setDebugCode(res.debug_code ?? null);
      return "sent";
    } catch (error) {
      if (error instanceof ApiError && error.code === "throttled") {
        setResendIn(Number(error.extra.retry_after ?? 60));
        setBanner({ kind: "info", text: error.message });
        return "throttled";
      }
      setBanner({ kind: "error", text: getErrorMessage(error) });
      return "failed";
    }
  }

  async function handleLogin(values: { email: string; password: string }) {
    setBusy(true);
    setBanner(null);
    try {
      finishAuth(
        await apiFetch<UserPublic>("/auth/login", { method: "POST", body: JSON.stringify(values) })
      );
    } catch (error) {
      setBusy(false);
      if (error instanceof ApiError && error.code === "email_not_verified") {
        const target = typeof error.extra.email === "string" ? error.extra.email : values.email;
        go("verify", {
          email: target,
          banner: { kind: "info", text: "Emailingiz hali tasdiqlanmagan. Tasdiqlash kodini kiriting." },
        });
        await requestCode("resend", target);
        return;
      }
      const hint =
        error instanceof ApiError && error.code === "invalid_credentials" && googleClientId
          ? " Google orqali ro'yxatdan o'tgan bo'lsangiz, Google tugmasidan foydalaning."
          : "";
      setBanner({ kind: "error", text: getErrorMessage(error) + hint });
    }
  }

  async function handleRegister(values: { full_name: string; email: string; password: string }) {
    setBusy(true);
    setBanner(null);
    try {
      const res = await apiFetch<CodeResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      });
      const target = res.email ?? values.email;
      setResendIn(res.resend_in ?? 60);
      setDebugCode(res.debug_code ?? null);
      setBusy(false);
      go("verify", {
        email: target,
        banner: { kind: "success", text: `Tasdiqlash kodi ${target} manziliga yuborildi.` },
      });
    } catch (error) {
      setBusy(false);
      setBanner({ kind: "error", text: getErrorMessage(error) });
    }
  }

  async function handleVerify(code: string) {
    setBusy(true);
    setBanner(null);
    try {
      finishAuth(
        await apiFetch<UserPublic>("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ email, code }),
        })
      );
    } catch (error) {
      setBusy(false);
      setResetKey((k) => k + 1);
      setBanner({ kind: "error", text: getErrorMessage(error) });
    }
  }

  async function handleResend() {
    setIsResending(true);
    setBanner(null);
    const result = await requestCode(view === "reset" ? "forgot" : "resend", email);
    setIsResending(false);
    if (result === "sent") {
      setResetKey((k) => k + 1);
      setBanner({ kind: "success", text: "Yangi kod yuborildi." });
    }
  }

  async function handleForgot(targetEmail: string) {
    setBusy(true);
    setBanner(null);
    const result = await requestCode("forgot", targetEmail);
    setBusy(false);
    if (result !== "failed") {
      go("reset", {
        email: targetEmail,
        banner: { kind: "info", text: "Agar bu email ro'yxatdan o'tgan bo'lsa, kod yuborildi." },
      });
    }
  }

  async function handleReset(values: { code: string; new_password: string }) {
    setBusy(true);
    setBanner(null);
    try {
      const res = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, ...values }),
      });
      setBusy(false);
      go("login", { email, banner: { kind: "success", text: res.message } });
    } catch (error) {
      setBusy(false);
      setResetKey((k) => k + 1);
      setBanner({ kind: "error", text: getErrorMessage(error) });
    }
  }

  async function handleGoogle(credential: string) {
    setBusy(true);
    setBanner(null);
    try {
      finishAuth(
        await apiFetch<UserPublic>("/auth/google", {
          method: "POST",
          body: JSON.stringify({ credential }),
        })
      );
    } catch (error) {
      setBusy(false);
      setBanner({ kind: "error", text: getErrorMessage(error) });
    }
  }

  const isTabView = view === "login" || view === "register";

  return (
    <AuthShell>
      {isTabView && (
        <div role="tablist" aria-label="Kirish usuli" className="mb-6 grid grid-cols-2 rounded-xl bg-surface-2 p-1">
          {(
            [
              ["login", "Kirish"],
              ["register", "Ro'yxatdan o'tish"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={view === tab}
              onClick={() => view !== tab && go(tab)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                view === tab
                  ? "bg-primary-soft text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {(view === "verify" || view === "forgot" || view === "reset") && (
        <button
          type="button"
          onClick={() => go(view === "verify" ? "register" : "login", { email: view === "verify" ? "" : email })}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {view === "verify" ? "Boshqa email bilan" : "Kirishga qaytish"}
        </button>
      )}

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          {
            {
              login: "Tizimga kirish",
              register: "Hisob yaratish",
              verify: "Emailni tasdiqlang",
              forgot: "Parolni tiklash",
              reset: "Yangi parol o'rnating",
            }[view]
          }
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {view === "login" && "Kursingizni davom ettirish uchun kiring."}
          {view === "register" && "Bepul ro'yxatdan o'ting va o'rganishni boshlang."}
          {view === "verify" && (
            <>
              6 xonali kodni <span className="break-all font-medium text-text-primary">{email}</span> manziliga
              yubordik.
            </>
          )}
          {view === "forgot" && "Emailingizni kiriting, biz 6 xonali kod yuboramiz."}
          {view === "reset" && (
            <>
              <span className="break-all font-medium text-text-primary">{email}</span> manziliga yuborilgan
              kodni va yangi parolni kiriting.
            </>
          )}
        </p>
      </div>

      <div className="space-y-4">
        {view === "register" && emailDisabled && (
          <FormBanner
            banner={{
              kind: "info",
              text: "Email orqali tasdiqlash hozircha ishlamayapti. Google orqali davom eting yoki administratorga murojaat qiling.",
            }}
          />
        )}
        <FormBanner banner={banner} />

        {isTabView && googleClientId && (
          <>
            <GoogleButton
              clientId={googleClientId}
              onCredential={handleGoogle}
              text={view === "register" ? "signup_with" : "signin_with"}
            />
            <div className="flex items-center gap-3 text-xs text-text-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              yoki email bilan
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        {view === "login" && (
          <LoginForm
            defaultEmail={email}
            isSubmitting={busy}
            onSubmit={handleLogin}
            onForgot={(typed) => go("forgot", { email: typed || email })}
          />
        )}
        {view === "register" && (
          <RegisterForm
            defaultEmail={email}
            isSubmitting={busy}
            disabled={emailDisabled}
            onSubmit={handleRegister}
          />
        )}
        {view === "verify" && (
          <VerifyForm
            resetKey={resetKey}
            isSubmitting={busy}
            resendIn={resendIn}
            isResending={isResending}
            debugCode={debugCode}
            onSubmit={handleVerify}
            onResend={handleResend}
          />
        )}
        {view === "forgot" && <ForgotForm defaultEmail={email} isSubmitting={busy} onSubmit={handleForgot} />}
        {view === "reset" && (
          <ResetForm
            resetKey={resetKey}
            isSubmitting={busy}
            resendIn={resendIn}
            isResending={isResending}
            debugCode={debugCode}
            onSubmit={handleReset}
            onResend={handleResend}
          />
        )}
      </div>
    </AuthShell>
  );
}
