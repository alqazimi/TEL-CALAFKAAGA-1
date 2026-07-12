"use client";

import { useEffect, useState } from "react";
import {
  isConvexBackendUnavailable,
  subscribeConvexBackendStatus,
} from "@/lib/use-safe-query";
import { isApiProvider } from "@/data/provider";
import { useTranslation } from "@/lib/i18n/context";
import { WHATSAPP_URL } from "@/lib/constants";

function markDownFromProbe(message: string) {
  if (
    message.includes("Server Error") ||
    message.includes("free plan limits") ||
    message.includes("deployments have been disabled")
  ) {
    window.dispatchEvent(
      new CustomEvent("hel-convex-down", { detail: message })
    );
  }
}

/**
 * Friendly notice when the backend is down.
 * Never expose plan names, vendor dashboards, or internal errors to members.
 */
export function BackendStatusBanner() {
  const { t } = useTranslation();
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (isApiProvider()) {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? "")
        .trim()
        .replace(/\/$/, "");
      if (!base) {
        setDown(true);
        return;
      }
      const controller = new AbortController();
      void fetch(`${base}/health`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) setDown(true);
        })
        .catch(() => {
          setDown(true);
        });
      return () => controller.abort();
    }

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
      <p className="font-semibold">{t("setup.serviceUnavailableTitle")}</p>
      <p className="mt-1 text-amber-900/90">
        {t("setup.serviceUnavailableBody")}{" "}
        <a
          className="font-medium underline underline-offset-2"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
        .
      </p>
    </div>
  );
}
