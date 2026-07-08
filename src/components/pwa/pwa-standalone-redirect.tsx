"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isStandaloneDisplay } from "@/lib/pwa";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import type { CurrentUser } from "@/types";

/**
 * Installed PWA cold-opens on `/` should land in the app, not marketing.
 * Do not redirect other marketing pages — staff and members must browse freely.
 */
export function PwaStandaloneRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useQuery(api.users.currentUser) as CurrentUser | null | undefined;

  useEffect(() => {
    if (!isStandaloneDisplay() || !pathname || user === undefined) return;

    if (user === null) {
      if (!pathname.startsWith("/login")) {
        router.replace("/login?source=pwa");
      }
      return;
    }

    if (pathname !== "/") return;

    router.replace(getAuthenticatedHomeRoute(user.profile));
  }, [pathname, router, user]);

  return null;
}
