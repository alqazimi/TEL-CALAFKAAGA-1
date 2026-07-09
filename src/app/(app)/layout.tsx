export const dynamic = "force-dynamic";

import { ReactNode, Suspense } from "react";
import { AppEnglishShell } from "@/components/layout/app-english-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppEnglishShell>
      <Suspense>{children}</Suspense>
    </AppEnglishShell>
  );
}
