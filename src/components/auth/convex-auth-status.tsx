"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { isConvexConfigured } from "@/lib/convex-client";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

const AUTH_TIMEOUT_MS = 10_000;

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

/**
 * Shows a clear setup error instead of an infinite loading skeleton.
 * On auth hang: clear the session and keep the site usable (do not blank the whole app).
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

  // #region agent log
  useEffect(() => {
    if (!mounted) return;
    fetch('http://127.0.0.1:7871/ingest/6cf5a6b8-1f24-414d-9025-2210f130bf17',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7bb7f4'},body:JSON.stringify({sessionId:'7bb7f4',runId:'pre-fix',hypothesisId:'A',location:'convex-auth-status.tsx:state',message:'ConvexAuthStatus state',data:{isLoading,timedOut,dismissed,configured:isConvexConfigured(),host:typeof window!=='undefined'?window.location.host:null},timestamp:Date.now()})}).catch(()=>{});
  }, [mounted, isLoading, timedOut, dismissed]);
  // #endregion

  useEffect(() => {
    if (!timedOut || dismissed) return;
    // Bad/stale tokens often leave auth spinning — clear them once.
    void signOut().catch(() => undefined);
  }, [timedOut, dismissed, signOut]);

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
