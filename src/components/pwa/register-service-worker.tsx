"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isAppShellRoute } from "@/lib/routes";

/**
 * Service worker is only for the signed-in app (offline icons / install).
 * Marketing pages (including Google search landings) must not use a SW —
 * stale workers in Chrome commonly cause endless loading while Firefox is fine.
 */
export function RegisterServiceWorker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onApp = isAppShellRoute(pathname);

    if (!onApp) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          void reg.unregister();
        }
      });
      if ("caches" in window) {
        void caches.keys().then((keys) => {
          for (const key of keys) {
            if (key.startsWith("hel-calafkaaga-")) {
              void caches.delete(key);
            }
          }
        });
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, [pathname]);

  return null;
}
