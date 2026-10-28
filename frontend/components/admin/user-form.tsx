"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/types";

const baseFields = {
  full_name: z.string().trim().min(2, "Ism-familiya kamida 2 belgidan iborat bo'lishi kerak").max(120),
  email: z.string().trim().email("Email manzil noto'g'ri kiritilgan"),
  role: z.enum(["student", "author", "admin"], { required_error: "Rolni tanlang" }),
};

const createSchema = z.object({
  ...baseFields,
  password: z.string().min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak").max(128),
  is_email_verified: z.boolean(),
});

// Tahrirlashda parol ixtiyoriy: bo'sh qoldirilsa, o'zgarmaydi.
const editSchema = z.object({
  ...baseFields,
  password: z
    .string()
    .max(128)
    .refine((v) => v === "" || v.length >= 8, "Parol kamida 8 belgidan iborat bo'lishi kerak"),
  status: z.enum(["active", "blocked"]),
});

export type CreateUserValues = z.infer<typeof createSchema>;
export type EditUserValues = z.infer<typeof editSchema>;

interface CommonProps {
  isSubmitting: boolean;
  cancelHref: string;
}

type UserFormProps =
  | (CommonProps & {
      mode: "create";
      onSubmit: (values: CreateUserValues) => void | Promise<void>;
    })
  | (CommonProps & {
      mode: "edit";
      defaultValues: Omit<EditUserValues, "password">;
      /** O'z hisobingizni tahrirlayotganda rol va holat o'zgartirilmaydi. */
      isSelf: boolean;
      onSubmit: (values: EditUserValues) => void | Promise<void>;
    });

export function UserForm(props: UserFormProps) {
  return props.mode === "create" ? <CreateForm {...props} /> : <EditForm {...props} />;
}

function RoleField({
  form,
  disabled,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Rol</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Rolni tanlang" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {disabled && (
            <FormDescription>O&apos;z rolingizni o&apos;zgartira olmaysiz.</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormActions({ isSubmitting, cancelHref, label }: CommonProps & { label: string }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button asChild variant="outline" type="button">
        <Link href={cancelHref}>Bekor qilish</Link>
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saqlanmoqda..." : label}
      </Button>
    </div>
  );
}

function CreateForm({
  onSubmit,
  isSubmitting,
  cancelHref,
}: CommonProps & { onSubmit: (values: CreateUserValues) => void | Promise<void> }) {
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "student",
      is_email_verified: true,
    },
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
                <Input autoComplete="off" placeholder="Masalan: Dilshod Karimov" {...field} />
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
                <Input type="email" autoComplete="off" placeholder="email@misol.uz" {...field} />
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
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>Kamida 8 belgi. Foydalanuvchiga o&apos;zingiz yetkazasiz.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <RoleField form={form} />
        <FormField
          control={form.control}
          name="is_email_verified"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 space-y-0 rounded-xl border border-border p-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
              </FormControl>
              <div className="space-y-0.5">
                <FormLabel className="cursor-pointer">Email tasdiqlangan deb belgilansin</FormLabel>
                <FormDescription>
                  Belgilansa, foydalanuvchi emailga kod yuborilmasdan darhol kira oladi.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormActions isSubmitting={isSubmitting} cancelHref={cancelHref} label="Foydalanuvchini yaratish" />
      </form>
    </Form>
  );
}

function EditForm({
  defaultValues,
  isSelf,
  onSubmit,
  isSubmitting,
  cancelHref,
}: CommonProps & {
  defaultValues: Omit<EditUserValues, "password">;
  isSelf: boolean;
  onSubmit: (values: EditUserValues) => void | Promise<void>;
}) {
  const form = useForm<EditUserValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { ...defaultValues, password: "" },
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
                <Input autoComplete="off" {...field} />
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
                <Input type="email" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <RoleField form={form} disabled={isSelf} />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holat</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSelf}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="blocked">Bloklangan</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {isSelf
                  ? "O'zingizni bloklay olmaysiz."
                  : "Bloklangan foydalanuvchi platformaga kira olmaydi va joriy sessiyasi to'xtatiladi."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yangi parol</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormDescription>Kamida 8 belgi. O&apos;zgartirmaslik uchun bo&apos;sh qoldiring.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormActions isSubmitting={isSubmitting} cancelHref={cancelHref} label="O'zgarishlarni saqlash" />
      </form>
    </Form>
  );
}
