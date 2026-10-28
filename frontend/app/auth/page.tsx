import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthFlow } from "@/components/auth/auth-flow";

export const metadata: Metadata = {
  title: "Kirish va ro'yxatdan o'tish — EdTech",
};

export default function AuthPage() {
  return (
    <Suspense>
      <AuthFlow />
    </Suspense>
  );
}
