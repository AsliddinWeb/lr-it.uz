import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";

import { QueryClientProviderWrapper } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-sora",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

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
      <body className={`${sora.variable} ${inter.variable} font-sans`}>
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
