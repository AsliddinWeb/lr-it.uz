import { SettingsContent } from "@/components/dashboard/settings-content";

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 font-display text-2xl font-bold text-text-primary">Sozlamalar</h1>
      <SettingsContent />
    </main>
  );
}
