"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "sonner";
import { IdleSessionGuard } from "@/components/auth/idle-session-guard";
import { ApiAuthProvider } from "@/components/auth/api-auth-provider";
import { LanguageProvider } from "@/lib/i18n/context";
import { validateFrontendEnv } from "@/data/env";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const report = validateFrontendEnv();
    if (!report.ok && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[frontend-env]", report.errors);
    }
  }, []);

  return (
    <ApiAuthProvider>
      <LanguageProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <IdleSessionGuard />
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </LanguageProvider>
    </ApiAuthProvider>
  );
}
