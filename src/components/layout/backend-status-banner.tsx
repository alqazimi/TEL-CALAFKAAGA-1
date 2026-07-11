"use client";

import { useEffect, useState } from "react";
import {
  isConvexBackendUnavailable,
  subscribeConvexBackendStatus,
} from "@/lib/use-safe-query";

function markDownFromProbe(message: string) {
  if (
    message.includes("Server Error") ||
    message.includes("free plan limits") ||
    message.includes("deployments have been disabled")
  ) {
    // Re-use the same signal path as useSafeQuery by throwing a synthetic error
    // through a tiny shared setter — import side effect via custom event.
    window.dispatchEvent(
      new CustomEvent("hel-convex-down", { detail: message })
    );
  }
}

/**
 * Shown when Convex returns plan-limit / Server Error so users know
 * why login and app features are down — instead of a blank error page.
 */
export function BackendStatusBanner() {
  const [down, setDown] = useState(false);

  useEffect(() => {
    setDown(isConvexBackendUnavailable());
    const unsub = subscribeConvexBackendStatus(() => {
      setDown(isConvexBackendUnavailable());
    });
    const onDown = () => setDown(true);
    window.addEventListener("hel-convex-down", onDown);

    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (url) {
      void fetch(`${url}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "users:currentUser",
          args: {},
          format: "json",
        }),
      })
        .then(async (res) => {
          const data = (await res.json().catch(() => null)) as {
            status?: string;
            errorMessage?: string;
          } | null;
          if (data?.status === "error" && data.errorMessage) {
            markDownFromProbe(data.errorMessage);
            setDown(true);
          }
        })
        .catch(() => {
          setDown(true);
        });
    }

    return () => {
      unsub();
      window.removeEventListener("hel-convex-down", onDown);
    };
  }, []);

  if (!down) return null;

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
    >
      <p className="font-semibold">
        Adeegga waa ku meel gaar ah xiran yahay / Backend temporarily unavailable
      </p>
      <p className="mt-1 text-amber-900/90">
        Convex Free plan limits exceeded — open{" "}
        <a
          className="font-medium underline underline-offset-2"
          href="https://dashboard.convex.dev"
          target="_blank"
          rel="noreferrer"
        >
          dashboard.convex.dev
        </a>{" "}
        and upgrade (or free usage), then reload this page.
      </p>
    </div>
  );
}
