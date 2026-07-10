"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";

/** Redirects signed-in users away from login/register pages. */
export function GuestGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const user = useQuery(api.users.currentUser, isAuthenticated ? {} : "skip");

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    // Wait for profile so staff are not sent to member onboarding routes.
    if (user === undefined) return;

    if (user?.profile?.registrationComplete === false) {
      router.replace("/register/details");
      return;
    }
    router.replace(getAuthenticatedHomeRoute(user?.profile ?? undefined));
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || (isAuthenticated && user === undefined)) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  return <>{children}</>;
}
