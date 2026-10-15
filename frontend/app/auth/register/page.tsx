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

const schema = z
  .object({
    full_name: z.string().min(2, "Ism-familiya kamida 2 belgidan iborat bo'lishi kerak"),
    email: z.string().email("Email manzil noto'g'ri"),
    password: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Parollar mos kelmadi",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", confirm_password: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: values.full_name,
          email: values.email,
          password: values.password,
        }),
      });
      toast.success("Ro'yxatdan o'tish muvaffaqiyatli. Tasdiqlash kodi emailga yuborildi.");
      router.push(`/auth/verify?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Ro'yxatdan o'tish"
      description="Bepul IT ta'lim platformasiga qo'shiling."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ism-familiya</FormLabel>
                <FormControl>
                  <Input placeholder="Asadbek Aliyev" {...field} />
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
                <FormLabel>Parol</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parolni tasdiqlang</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
          </Button>
        </form>
      </Form>
      <p className="mt-4 text-center text-sm text-text-muted">
        Akkountingiz bormi?{" "}
        <Link href="/auth/login" className="text-primary hover:underline">
          Kirish
        </Link>
      </p>
    </AuthCard>
  );
}
