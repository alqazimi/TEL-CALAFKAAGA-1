"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSafeQuery } from "@/lib/use-safe-query";
import { api } from "../../../../convex/_generated/api";
import type { MatchResult, MutualMatch } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MemberDataLoading } from "@/components/auth/member-data-loading";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import { NextStepCard } from "@/components/dashboard/next-step-card";
import { TrialBanner } from "@/components/payment/trial-banner";
import { useStaffRedirect } from "@/hooks/use-staff-redirect";
import { hasPaidAccess } from "@/lib/access";
import { isInTrialPeriod } from "@/lib/trial";
import { useTranslation } from "@/lib/i18n/context";
import {
  calculateProfileProgress,
  getRemainingProgressPercent,
  isProfileQueriesLoading,
} from "@/lib/profile-progress";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isStaff, isLoading } = useStaffRedirect();
  const preferences = useSafeQuery(
    api.profiles.getPreferences,
    user !== undefined && !isStaff ? {} : "skip"
  ) as Preferences | null | undefined;
  // null = loaded with no profile; undefined = still loading user
  const profile = user === undefined ? undefined : (user?.profile ?? null);
  const queriesLoading =
    isLoading || (!isStaff && isProfileQueriesLoading(profile, preferences));

  const profileReady = !!profile?.questionnaireComplete;
  const canViewMatches = profileReady && !isStaff && hasPaidAccess(profile);
  const matches = useSafeQuery(
    api.matches.getMatches,
    canViewMatches ? {} : "skip"
  ) as MatchResult[] | undefined;
  const myMatches = useSafeQuery(
    api.matches.getMyMatches,
    canViewMatches ? {} : "skip"
  ) as MutualMatch[] | undefined;

  const shouldUseDiscoverHome = profileReady && hasPaidAccess(profile);

  useEffect(() => {
    if (shouldUseDiscoverHome) {
      router.replace("/matches");
    }
  }, [router, shouldUseDiscoverHome]);

  if (isStaff || shouldUseDiscoverHome) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl" role="status" aria-busy>
          <Skeleton className="h-8 w-48" aria-hidden />
          <Skeleton className="h-40 w-full rounded-2xl" aria-hidden />
        </div>
      </DashboardLayout>
    );
  }

  if (user === undefined || queriesLoading) {
    return (
      <DashboardLayout>
        <MemberDataLoading pending />
      </DashboardLayout>
    );
  }

  const firstName = profile?.name?.split(" ")[0] ?? t("dashboard.guestName");
  const isComplete = profileReady;
  const profileProgress = profile
    ? calculateProfileProgress(profile, preferences ?? undefined)
    : 0;
  const remainingProgress = profile
    ? getRemainingProgressPercent(profile, preferences ?? undefined)
    : 100;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {t("dashboard.hello", { name: firstName })}
          </h1>
          {!isComplete && profile && (
            <p className="text-sm text-muted-foreground mt-2">
              {t("dashboard.profileProgressHint", {
                percent: profileProgress,
                remaining: remainingProgress,
              })}
            </p>
          )}
        </div>

        {profile && isInTrialPeriod(profile) && (
          <TrialBanner profile={profile} />
        )}

        {user && (
          <NextStepCard user={user} matches={matches} mutualCount={myMatches?.length ?? 0} />
        )}

        {profile && !isComplete && (
          <ProfileCompletionCard profile={profile} preferences={preferences} />
        )}
      </div>
    </DashboardLayout>
  );
}
