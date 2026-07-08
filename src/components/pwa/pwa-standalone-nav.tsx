"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { isStandaloneDisplay } from "@/lib/pwa";
import { isAppShellRoute, isAuthRoute } from "@/lib/routes";

/**
 * Installed app: keep bottom tabs on website pages (About, FAQ, etc.)
 * so users can always return to Dashboard / Matches without getting stuck.
 */
export function PwaStandaloneNav() {
  const pathname = usePathname();
  const standalone = isStandaloneDisplay();
  const onMarketing =
    !!pathname && !isAppShellRoute(pathname) && !isAuthRoute(pathname);

  useEffect(() => {
    if (!standalone) return;
    document.documentElement.classList.toggle("pwa-standalone", true);
    return () => {
      document.documentElement.classList.remove("pwa-standalone");
      document.documentElement.classList.remove("pwa-standalone-marketing");
    };
  }, [standalone]);

  useEffect(() => {
    if (!standalone) return;
    document.documentElement.classList.toggle("pwa-standalone-marketing", onMarketing);
  }, [onMarketing, standalone]);

  if (!standalone || !onMarketing) return null;

  return <AppMobileNav />;
}
