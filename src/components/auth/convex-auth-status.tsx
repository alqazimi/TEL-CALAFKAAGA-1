"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useConvexAuth } from "convex/react";
import { isConvexConfigured } from "@/lib/convex-client";

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
      <SetupMessage title="Convex is not configured">
        <p>
          <code className="text-foreground">NEXT_PUBLIC_CONVEX_URL</code> is missing on
          this deployment.
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Run <code className="text-foreground">npx convex deploy</code></li>
          <li>Copy the production URL (ends with <code className="text-foreground">.convex.cloud</code>)</li>
          <li>Add it in Vercel → Settings → Environment Variables</li>
          <li>Redeploy Vercel</li>
        </ol>
      </SetupMessage>
    );
  }

  if (isLoading && timedOut) {
    return (
      <SetupMessage title="Cannot connect to Convex">
        <p>Auth is stuck loading. This usually means production Convex auth is not set up yet.</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            Deploy backend: <code className="text-foreground">npx convex deploy</code>
          </li>
          <li>
            Set Vercel <code className="text-foreground">NEXT_PUBLIC_CONVEX_URL</code> to
            the <strong>production</strong> URL (not dev)
          </li>
          <li>
            Run:{" "}
            <code className="text-foreground block mt-1 break-all">
              SITE_URL=https://hel-calafkaaga-d9g4.vercel.app npm run setup:auth:prod
            </code>
          </li>
          <li>Redeploy Vercel again</li>
        </ol>
      </SetupMessage>
    );
  }

  return <>{children}</>;
}
