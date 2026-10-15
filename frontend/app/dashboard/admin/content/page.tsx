"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Mail, MessageCircleQuestion } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { useAdminSiteContent } from "@/lib/queries/content";

const KEY_LABELS: Record<string, string> = {
  home_hero_title: "Bosh sahifa — sarlavha",
  home_hero_subtitle: "Bosh sahifa — subtitr",
  about_title: "Biz haqimizda — sarlavha",
  about_body: "Biz haqimizda — matn",
  contact_title: "Aloqa — sarlavha",
  contact_body: "Aloqa — matn",
  contact_email: "Aloqa — email",
};

const BODY_KEYS = new Set(["about_body", "contact_body"]);

const PAGE_GROUPS: { title: string; icon: React.ElementType; keys: string[] }[] = [
  { title: "Bosh sahifa", icon: Home, keys: ["home_hero_title", "home_hero_subtitle"] },
  { title: "Biz haqimizda", icon: MessageCircleQuestion, keys: ["about_title", "about_body"] },
  { title: "Aloqa", icon: Mail, keys: ["contact_title", "contact_body", "contact_email"] },
];

function ContentField({
  contentKey,
  initialValue,
}: {
  contentKey: string;
  initialValue: string;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setValue(initialValue), [initialValue]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await apiFetch(`/admin/content/${contentKey}`, {
        method: "PATCH",
        body: JSON.stringify({ content: value }),
      });
      toast.success("Saqlandi");
      queryClient.invalidateQueries({ queryKey: ["admin", "content"] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{KEY_LABELS[contentKey] ?? contentKey}</Label>
      <div className="flex gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={BODY_KEYS.has(contentKey) ? 6 : 2}
        />
        <Button size="sm" disabled={isSaving || value === initialValue} onClick={handleSave}>
          Saqlash
        </Button>
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  const { data: items, isLoading } = useAdminSiteContent();

  const itemsByKey = new Map((items ?? []).map((item) => [item.key, item.content]));

  return (
    <main className="px-6 py-8">
      <h2 className="font-display text-xl font-bold text-text-primary">Sayt kontenti</h2>
      <p className="text-sm text-text-muted">
        Bosh sahifa, &quot;Biz haqimizda&quot; va &quot;Aloqa&quot; sahifalaridagi matnlarni tahrirlang.
      </p>

      {isLoading ? (
        <div className="mt-6 max-w-2xl space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6 max-w-2xl space-y-6">
          {PAGE_GROUPS.map((group) => {
            const keysPresent = group.keys.filter((key) => itemsByKey.has(key));
            if (keysPresent.length === 0) return null;
            const Icon = group.icon;
            return (
              <Card key={group.title}>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <CardTitle className="font-display text-lg">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {keysPresent.map((key) => (
                    <ContentField key={key} contentKey={key} initialValue={itemsByKey.get(key) ?? ""} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
