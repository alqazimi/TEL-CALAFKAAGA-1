"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";

/** Redirects signed-in users away from login/register pages. */
export function GuestGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const user = useQuery(api.users.currentUser);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getAuthenticatedHomeRoute(user?.profile ?? undefined));
    }
  }, [isAuthenticated, isLoading, router, user?.profile]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  return <>{children}</>;
}
