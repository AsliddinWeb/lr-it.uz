"use client";

import { useState } from "react";
import Link from "next/link";
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
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSent(true);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Parolni tiklash"
      description="Ro'yxatdan o'tgan emailingizni kiriting, tiklash kodini yuboramiz."
    >
      {sent ? (
        <p className="text-sm text-text-primary">
          Agar bunday email tizimda mavjud bo&apos;lsa, parolni tiklash kodi yuborildi.
          Emailingizni tekshiring.
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@misol.uz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Yuborilmoqda..." : "Tiklash kodini yuborish"}
            </Button>
          </form>
        </Form>
      )}
      <p className="mt-4 text-center text-sm text-text-muted">
        <Link href="/auth/login" className="text-primary hover:underline">
          Kirish sahifasiga qaytish
        </Link>
      </p>
    </AuthCard>
  );
}
