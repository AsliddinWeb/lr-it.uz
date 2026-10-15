"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  password: z.string().min(1, "Parolni kiriting"),
});

type FormValues = z.infer<typeof schema>;

const ROLE_REDIRECT: Record<string, string> = {
  student: "/dashboard/student",
  author: "/dashboard/author",
  admin: "/dashboard/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const user = await apiFetch<{ role: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Xush kelibsiz!");
      router.push(ROLE_REDIRECT[user.role] ?? "/");
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Tizimga kirish" description="Kursingizni davom ettirish uchun kiring.">
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Parol</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Parolni unutdingizmi?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" {...field} />
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
      <p className="mt-4 text-center text-sm text-text-muted">
        Akkountingiz yo&apos;qmi?{" "}
        <Link href="/auth/register" className="text-primary hover:underline">
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </p>
    </AuthCard>
  );
}
