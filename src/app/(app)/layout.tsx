export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { AppEnglishShell } from "@/components/layout/app-english-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppEnglishShell>{children}</AppEnglishShell>;
}
