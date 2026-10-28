"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { z } from "zod";

import { OtpInput } from "@/components/auth/otp-input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface Banner {
  kind: "error" | "info" | "success";
  text: string;
}

export function FormBanner({ banner }: { banner: Banner | null }) {
  if (!banner) return null;
  const styles = {
    error: { box: "bg-danger/10 text-danger", icon: AlertCircle },
    info: { box: "bg-primary-soft text-primary", icon: Info },
    success: { box: "bg-success/10 text-success", icon: CheckCircle2 },
  }[banner.kind];
  const Icon = styles.icon;

  return (
    <div
      role={banner.kind === "error" ? "alert" : "status"}
      className={cn("flex gap-2.5 rounded-xl p-3 text-sm", styles.box)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{banner.text}</p>
    </div>
  );
}

const emailField = z.string().trim().min(1, "Emailni kiriting").email("Email manzil noto'g'ri kiritilgan");

/* ----------------------------------------------------------------- kirish */

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Parolni kiriting"),
});

export function LoginForm({
  defaultEmail,
  isSubmitting,
  onSubmit,
  onForgot,
}: {
  defaultEmail: string;
  isSubmitting: boolean;
  onSubmit: (values: z.infer<typeof loginSchema>) => void;
  onForgot: (email: string) => void;
}) {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="email@misol.uz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Parol</FormLabel>
                <button
                  type="button"
                  onClick={() => onForgot(form.getValues("email"))}
                  className="text-xs text-primary hover:underline"
                >
                  Parolni unutdingizmi?
                </button>
              </div>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Kirilmoqda..." : "Kirish"}
        </Button>
      </form>
    </Form>
  );
}

/* ------------------------------------------------- ro'yxatdan o'tish */

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Ism-familiya kamida 2 belgidan iborat bo'lishi kerak").max(120),
  email: emailField,
  password: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak").max(128),
});

export function RegisterForm({
  isSubmitting,
  disabled,
  defaultEmail,
  onSubmit,
}: {
  isSubmitting: boolean;
  /** Email xizmati ishlamayotgan bo'lsa, ro'yxatdan o'tib bo'lmaydi. */
  disabled: boolean;
  defaultEmail: string;
  onSubmit: (values: z.infer<typeof registerSchema>) => void;
}) {
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: defaultEmail, password: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ism-familiya</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Masalan: Dilshod Karimov" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="email@misol.uz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parol</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>Kamida 8 belgi.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || disabled}>
          {isSubmitting ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
        </Button>
      </form>
    </Form>
  );
}

/* ----------------------------------------------- kod yuborishni qayta so'rash */

export function ResendRow({
  resendIn,
  isResending,
  onResend,
}: {
  resendIn: number;
  isResending: boolean;
  onResend: () => void;
}) {
  return (
    <p className="text-center text-sm text-text-muted">
      Kod kelmadimi?{" "}
      {resendIn > 0 ? (
        <span className="tabular-nums">Qayta yuborish ({resendIn} s)</span>
      ) : (
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="font-medium text-primary hover:underline disabled:opacity-60"
        >
          {isResending ? "Yuborilmoqda..." : "Kodni qayta yuborish"}
        </button>
      )}
    </p>
  );
}

/** Faqat lokal ishlab chiqishda (SMTP yo'q): backend kodni javobda qaytaradi. */
function DebugCode({ code, onFill }: { code: string; onFill: (code: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-surface-2 p-3 text-xs text-text-muted">
      <span>
        Lokal rejim (email yuborilmaydi): kod <strong className="font-mono text-text-primary">{code}</strong>
      </span>
      <button type="button" onClick={() => onFill(code)} className="shrink-0 font-medium text-primary hover:underline">
        To&apos;ldirish
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- tasdiqlash */

export function VerifyForm({
  isSubmitting,
  resendIn,
  isResending,
  debugCode,
  onSubmit,
  onResend,
  resetKey,
}: {
  isSubmitting: boolean;
  resendIn: number;
  isResending: boolean;
  debugCode: string | null;
  onSubmit: (code: string) => void;
  onResend: () => void;
  /** Qiymat o'zgarsa, kiritilgan kod tozalanadi (masalan xatodan keyin). */
  resetKey: number;
}) {
  return (
    <VerifyFormInner
      key={resetKey}
      isSubmitting={isSubmitting}
      resendIn={resendIn}
      isResending={isResending}
      debugCode={debugCode}
      onSubmit={onSubmit}
      onResend={onResend}
    />
  );
}

function VerifyFormInner({
  isSubmitting,
  resendIn,
  isResending,
  debugCode,
  onSubmit,
  onResend,
}: Omit<Parameters<typeof VerifyForm>[0], "resetKey">) {
  const [code, setCode] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === 6) onSubmit(code);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="otp">Tasdiqlash kodi</Label>
        <OtpInput id="otp" value={code} onChange={setCode} onComplete={onSubmit} disabled={isSubmitting} />
      </div>
      {debugCode && <DebugCode code={debugCode} onFill={setCode} />}
      <Button type="submit" className="w-full" disabled={isSubmitting || code.length !== 6}>
        {isSubmitting ? "Tekshirilmoqda..." : "Tasdiqlash"}
      </Button>
      <ResendRow resendIn={resendIn} isResending={isResending} onResend={onResend} />
    </form>
  );
}

/* ------------------------------------------------------------ parolni tiklash */

const forgotSchema = z.object({ email: emailField });

export function ForgotForm({
  defaultEmail,
  isSubmitting,
  onSubmit,
}: {
  defaultEmail: string;
  isSubmitting: boolean;
  onSubmit: (email: string) => void;
}) {
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: defaultEmail },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => onSubmit(v.email))} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="email@misol.uz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Yuborilmoqda..." : "Kod yuborish"}
        </Button>
      </form>
    </Form>
  );
}

const resetSchema = z.object({
  new_password: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak").max(128),
});

type ResetFormProps = {
  isSubmitting: boolean;
  resendIn: number;
  isResending: boolean;
  debugCode: string | null;
  onSubmit: (values: { code: string; new_password: string }) => void;
  onResend: () => void;
};

export function ResetForm({ resetKey, ...props }: ResetFormProps & { resetKey: number }) {
  // `resetKey` o'zgarganda (masalan noto'g'ri koddan keyin) forma va kiritilgan kod tozalanadi.
  return <ResetFormInner key={resetKey} {...props} />;
}

function ResetFormInner({
  isSubmitting,
  resendIn,
  isResending,
  debugCode,
  onSubmit,
  onResend,
}: ResetFormProps) {
  const [code, setCode] = useState("");
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { new_password: "" },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => code.length === 6 && onSubmit({ code, new_password: v.new_password }))}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="reset-otp">Emailga kelgan kod</Label>
          <OtpInput id="reset-otp" value={code} onChange={setCode} disabled={isSubmitting} />
        </div>
        {debugCode && <DebugCode code={debugCode} onFill={setCode} />}
        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yangi parol</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>Kamida 8 belgi.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || code.length !== 6}>
          {isSubmitting ? "Saqlanmoqda..." : "Parolni yangilash"}
        </Button>
        <ResendRow resendIn={resendIn} isResending={isResending} onResend={onResend} />
      </form>
    </Form>
  );
}
