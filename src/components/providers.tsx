"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "sonner";
import { getConvexClient, isConvexConfigured } from "@/lib/convex-client";
import { ConvexAuthStatus } from "@/components/auth/convex-auth-status";
import { IdleSessionGuard } from "@/components/auth/idle-session-guard";
import { LanguageProvider } from "@/lib/i18n/context";

export function Providers({ children }: { children: ReactNode }) {
  const convex = useMemo(() => getConvexClient(), []);

  useEffect(() => {
    if (!isConvexConfigured() && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Missing NEXT_PUBLIC_CONVEX_URL in local env.");
    }
  }, []);

  return (
    <ConvexAuthProvider client={convex}>
      <LanguageProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <IdleSessionGuard />
          <ConvexAuthStatus>{children}</ConvexAuthStatus>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </LanguageProvider>
    </ConvexAuthProvider>
  );
}
