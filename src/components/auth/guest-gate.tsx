"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoadingRecovery } from "@/components/auth/loading-recovery";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { useUnifiedAuth } from "@/data/auth/hooks";

/**
 * Redirects signed-in users away from login/register.
 * Never hide the form behind auth loading — Chrome guests must see login immediately.
 */
export function GuestGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useUnifiedAuth();
  const router = useRouter();
  const waitingOnUser = isAuthenticated && user === undefined;
  const stuck = useLoadingTimeout(waitingOnUser, 8_000);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (user === undefined) return;

    const profile = (user?.profile ?? undefined) as
      | { registrationComplete?: boolean }
      | undefined
      | null;

    if (profile?.registrationComplete === false) {
      router.replace("/register/details");
      return;
    }
    router.replace(getAuthenticatedHomeRoute(profile ?? undefined));
  }, [isAuthenticated, isLoading, router, user]);

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

  return <>{children}</>;
}
