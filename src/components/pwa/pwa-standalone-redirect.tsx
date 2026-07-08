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
    if (!isStandaloneDisplay() || !pathname || !isMarketingRoute(pathname)) {
      return;
    }

    if (user === undefined) return;

    if (user === null) {
      router.replace("/login");
      return;
    }

    router.replace(getAuthenticatedHomeRoute(user.profile));
  }, [pathname, router, user]);

  return null;
}
