import type { Metadata } from "next";

import { QueryClientProviderWrapper } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Shriftlar loyiha ichida (npm paketlari) — build va ishlash vaqtida tashqi serverga (Google Fonts) bog'liq emas.
import "@fontsource/sora/latin-700.css";
import "@fontsource/sora/latin-800.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";

import "./globals.css";

export const metadata: Metadata = {
  title: "EdTech — bepul IT ta'lim platformasi",
  description:
    "Python, C++ va kompyuter savodxonligini real vaqtda kod yozib, AI yordamida bepul o'rganing.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryClientProviderWrapper>
            {children}
            <Toaster />
          </QueryClientProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
