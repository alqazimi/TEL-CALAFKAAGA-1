"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { api } from "../../../convex/_generated/api";
import { LoadingRecovery } from "@/components/auth/loading-recovery";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";
import { getAuthenticatedHomeRoute } from "@/lib/routes";

/**
 * Redirects signed-in users away from login/register.
 * Never hide the form behind auth loading — Chrome guests must see login immediately
 * (same class of bug as homepage "Fadlan sug...").
 */
export function GuestGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const user = useSafeQuery(api.users.currentUser, isAuthenticated ? {} : "skip");
  const waitingOnUser = isAuthenticated && user === undefined;
  const stuck = useLoadingTimeout(waitingOnUser, 8_000);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (user === undefined) return;

    if (user?.profile?.registrationComplete === false) {
      router.replace("/register/details");
      return;
    }
    router.replace(getAuthenticatedHomeRoute(user?.profile ?? undefined));
  }, [isAuthenticated, isLoading, router, user]);

  // Confirmed signed-in: wait for profile then redirect (or recovery if stuck).
  if (isAuthenticated && !isLoading) {
    if (waitingOnUser && stuck) {
      return (
        <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
          <LoadingRecovery stuck />
        </div>
      );
    }

    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  // Guest or auth still resolving — always show login/register.
  return <>{children}</>;
}
