"use client";

import { useEffect, useMemo } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "sonner";
import { getConvexClient, isConvexConfigured } from "@/lib/convex-client";
import { ConvexAuthStatus } from "@/components/auth/convex-auth-status";
import { LanguageProvider } from "@/lib/i18n/context";

export function Providers({ children }: { children: ReactNode }) {
  const convex = useMemo(() => getConvexClient(), []);

  useEffect(() => {
    if (!isConvexConfigured()) {
      console.error(
        "Missing NEXT_PUBLIC_CONVEX_URL. Set it in .env.local locally or in your hosting provider (Vercel → Settings → Environment Variables) before deploying."
      );
    }
  }, []);

  return (
    <ConvexAuthProvider client={convex}>
      <LanguageProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexAuthStatus>{children}</ConvexAuthStatus>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </LanguageProvider>
    </ConvexAuthProvider>
  );
}
