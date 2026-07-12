"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { isConvexConfigured } from "@/lib/convex-client";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/lib/constants";

const AUTH_TIMEOUT_MS = 10_000;

/**
 * Auth gate with user-safe messaging only.
 * Never expose vendor names, deploy steps, or env var instructions publicly.
 */
export function ConvexAuthStatus({ children }: { children: ReactNode }) {
  const { isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [timedOut, setTimedOut] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!timedOut || dismissed) return;
    void signOut().catch(() => undefined);
  }, [timedOut, dismissed, signOut]);

  if (!mounted) return <>{children}</>;

  if (!isConvexConfigured()) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">{t("setup.serviceUnavailableTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("setup.serviceUnavailableBody")}{" "}
            <a
              className="font-medium text-primary underline underline-offset-2"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && timedOut && !dismissed) {
    return (
      <>
        <div className="sticky top-0 z-[60] border-b border-border bg-card px-4 py-3 text-center shadow-sm">
          <p className="text-sm font-medium">{t("setup.convexTimeoutTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("common.loadingStuck")}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              {t("common.retry")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setDismissed(true);
                void signOut().finally(() => {
                  window.location.assign("/login");
                });
              }}
            >
              {t("common.signInAgain")}
            </Button>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
