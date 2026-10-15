"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useBroadcastHistory } from "@/lib/queries/admin";

const TARGET_LABELS: Record<string, string> = {
  all: "Barcha foydalanuvchilar",
  student: "Faqat o'quvchilar",
  author: "Faqat mualliflar",
};

export default function AdminBroadcastPage() {
  const queryClient = useQueryClient();
  const { data: history, isLoading: historyLoading } = useBroadcastHistory();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [alsoTelegram, setAlsoTelegram] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleConfirmSend() {
    setIsSending(true);
    try {
      const result = await apiFetch<{ sent_count: number }>("/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({ title, message, target, also_telegram: alsoTelegram }),
      });
      toast.success(`${result.sent_count} foydalanuvchiga yuborildi`);
      setTitle("");
      setMessage("");
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "broadcast", "history"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="px-6 py-8">
      <h2 className="font-display text-xl font-bold text-text-primary">Bildirishnoma yuborish</h2>
      <p className="text-sm text-text-muted">
        Barcha yoki tanlangan rol foydalanuvchilariga ommaviy bildirishnoma yuboring.
      </p>

      <Card className="mt-6 max-w-xl">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Megaphone className="h-4 w-4" />
          </span>
          <CardTitle className="font-display text-lg">Yangi xabar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Sarlavha</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Yangilik" />
          </div>

          <div className="space-y-1.5">
            <Label>Xabar matni</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Xabar matnini yozing..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Kimga yuborilsin</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha foydalanuvchilar</SelectItem>
                <SelectItem value="student">Faqat o&apos;quvchilar</SelectItem>
                <SelectItem value="author">Faqat mualliflar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={alsoTelegram}
              onChange={(e) => setAlsoTelegram(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Telegram orqali ham yuborilsin (ulangan foydalanuvchilarga)
          </label>

          <Button
            onClick={() => setShowConfirm(true)}
            disabled={isSending || title.trim().length < 2 || message.trim().length < 2}
          >
            <Send className="h-4 w-4" />
            Yuborish
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 max-w-xl">
        <h3 className="font-display text-lg font-bold text-text-primary">Oldingi xabarlar</h3>
        {historyLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-text-primary">{item.title}</p>
                    <span className="text-xs text-text-muted">
                      {new Date(item.created_at).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-text-muted">{item.message}</p>
                  <p className="text-xs text-text-muted">
                    {TARGET_LABELS[item.target] ?? item.target} · {item.sent_count} ta yuborildi
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">Hali bildirishnoma yuborilmagan.</p>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Yuborishni tasdiqlang"
        description={`Ushbu xabar "${TARGET_LABELS[target]}" guruhiga yuboriladi. Bu amalni ortga qaytarib bo'lmaydi.`}
        confirmLabel="Ha, yuborish"
        isLoading={isSending}
        onConfirm={handleConfirmSend}
      />
    </main>
  );
}
