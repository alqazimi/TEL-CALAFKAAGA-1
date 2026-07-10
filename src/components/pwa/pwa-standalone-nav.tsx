"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { isStandaloneDisplay } from "@/lib/pwa";
import { isAppShellRoute, isAuthRoute } from "@/lib/routes";
import { isStaffRole } from "@/lib/access";

/**
 * Installed app: keep bottom tabs on website pages (About, FAQ, etc.)
 * so members can always return to Dashboard / Matches without getting stuck.
 * Staff use the marketing navbar on public pages instead of admin dashboard tabs.
 */
export function PwaStandaloneNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const [standalone, setStandalone] = useState(false);
  const onMarketing =
    !!pathname && !isAppShellRoute(pathname) && !isAuthRoute(pathname);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
  }, []);

  const user = useQuery(
    api.users.currentUser,
    standalone && onMarketing && isAuthenticated ? {} : "skip"
  );
  const isStaff = isStaffRole(user?.profile?.role);

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

  if (!standalone || !onMarketing || !isAuthenticated) return null;
  if (user === undefined) return null;
  if (isStaff) return null;

  return <AppMobileNav />;
}
