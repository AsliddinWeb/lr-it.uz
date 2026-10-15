"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiFetch, getErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Email manzil noto'g'ri"),
  code: z.string().length(6, "Kod 6 xonadan iborat bo'lishi kerak"),
});

type FormValues = z.infer<typeof schema>;

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get("email") ?? "", code: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Email muvaffaqiyatli tasdiqlandi. Endi tizimga kirishingiz mumkin.");
      router.push("/auth/login");
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Emailni tasdiqlash"
      description="Emailingizga yuborilgan 6 xonali kodni kiriting."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tasdiqlash kodi</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Tekshirilmoqda..." : "Tasdiqlash"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
