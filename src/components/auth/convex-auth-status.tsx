"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useConvexAuth } from "convex/react";
import { isConvexConfigured } from "@/lib/convex-client";
import { useTranslation } from "@/lib/i18n/context";

const AUTH_TIMEOUT_MS = 12_000;

function SetupMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="text-sm text-muted-foreground text-left space-y-3">{children}</div>
      </div>
    </div>
  );
}

/** Shows a clear setup error instead of an infinite loading skeleton. */
export function ConvexAuthStatus({ children }: { children: ReactNode }) {
  const { isLoading } = useConvexAuth();
  const [timedOut, setTimedOut] = useState(false);
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

  if (!mounted) return <>{children}</>;

  if (!isConvexConfigured()) {
    return (
      <SetupMessage title={t("setup.convexMissingTitle")}>
        <p>
          {t("setup.convexMissingBody", { envVar: "NEXT_PUBLIC_CONVEX_URL" })}
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <code className="text-foreground">{t("setup.convexMissingStep1")}</code>
          </li>
          <li>{t("setup.convexMissingStep2")}</li>
          <li>{t("setup.convexMissingStep3")}</li>
          <li>{t("setup.convexMissingStep4")}</li>
        </ol>
      </SetupMessage>
    );
  }

  if (isLoading && timedOut) {
    return (
      <SetupMessage title={t("setup.convexTimeoutTitle")}>
        <p>{t("setup.convexTimeoutBody")}</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <code className="text-foreground">{t("setup.convexTimeoutStep1")}</code>
          </li>
          <li>{t("setup.convexTimeoutStep2")}</li>
          <li>
            <code className="text-foreground block mt-1 break-all">
              {t("setup.convexTimeoutStep3")}
            </code>
          </li>
          <li>{t("setup.convexTimeoutStep4")}</li>
        </ol>
      </SetupMessage>
    );
  }

  return <>{children}</>;
}
