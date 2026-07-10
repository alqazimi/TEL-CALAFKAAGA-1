"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LoadingRecovery } from "@/components/auth/loading-recovery";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";
import { getAuthenticatedHomeRoute } from "@/lib/routes";

/** Redirects signed-in users away from login/register pages. */
export function GuestGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const user = useQuery(api.users.currentUser, isAuthenticated ? {} : "skip");
  const waitingOnUser = isAuthenticated && user === undefined;
  const stuck = useLoadingTimeout(isLoading || waitingOnUser, 8_000);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (user === undefined) return;

    if (user?.profile?.registrationComplete === false) {
      router.replace("/register/details");
      return;
    }
    router.replace(getAuthenticatedHomeRoute(user?.profile ?? undefined));
  }, [isAuthenticated, isLoading, router, user]);

  // Auth hung — still show login/register so the site is usable.
  if (isLoading && stuck) {
    return <>{children}</>;
  }

  if (waitingOnUser && stuck) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <LoadingRecovery stuck />
      </div>
    );
  }

  if (isLoading || waitingOnUser) {
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
