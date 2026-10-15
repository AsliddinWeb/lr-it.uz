"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { LEVEL_LABELS, TRACK_LABELS, type CourseDetail } from "@/lib/types";

const schema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 belgidan iborat bo'lishi kerak"),
  description: z.string().optional(),
  track: z.enum(["savodxonlik", "python", "cpp"], { required_error: "Yo'nalishni tanlang" }),
  level: z.enum(["boshlangich", "orta", "yuqori"], { required_error: "Darajani tanlang" }),
});

type FormValues = z.infer<typeof schema>;

export default function NewCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const course = await apiFetch<CourseDetail>("/courses", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Kurs yaratildi. Endi dasturini (modul/mavzu) to'ldiring.");
      router.push(`/dashboard/author/courses/${course.id}/curriculum`);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Yangi kurs yaratish</CardTitle>
            <CardDescription>
              Asosiy ma&apos;lumotlarni kiriting, keyingi qadamda kurs dasturini
              (modul va mavzular) qo&apos;shasiz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sarlavha</FormLabel>
                      <FormControl>
                        <Input placeholder="Python asoslari" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tavsif</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="track"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yo&apos;nalish</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Yo'nalishni tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TRACK_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daraja</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Darajani tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Yaratilmoqda..." : "Kursni yaratish"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
