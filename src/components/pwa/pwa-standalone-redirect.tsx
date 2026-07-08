"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isStandaloneDisplay } from "@/lib/pwa";
import { getAuthenticatedHomeRoute, isMarketingRoute } from "@/lib/routes";
import type { CurrentUser } from "@/types";

/** Open installed PWA on the member app, not the marketing homepage. */
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

    const target = getAuthenticatedHomeRoute(user.profile);

    if (pathname === "/" || isMarketingRoute(pathname)) {
      router.replace(target);
      return;
    }

    if (pathname === "/dashboard" && target !== "/dashboard") {
      router.replace(target);
    }
  }, [pathname, router, user]);

  return null;
}
