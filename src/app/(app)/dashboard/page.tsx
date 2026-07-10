"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { MatchResult, MutualMatch } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
  isMemberProfileReady,
} from "@/lib/profile-progress";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isStaff, isLoading } = useStaffRedirect();
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;
  const profile = user?.profile;
  const profileReady =
    !!profile && isMemberProfileReady(profile, preferences);
  const canViewMatches = profileReady && !isStaff && hasPaidAccess(profile);
  const matches = useQuery(
    api.matches.getMatches,
    canViewMatches ? {} : "skip"
  ) as MatchResult[] | undefined;
  const myMatches = useQuery(
    api.matches.getMyMatches,
    canViewMatches ? undefined : "skip"
  ) as MutualMatch[] | undefined;

  const shouldUseDiscoverHome = profileReady && hasPaidAccess(profile);

  useEffect(() => {
    if (shouldUseDiscoverHome) {
      router.replace("/matches");
    }
  }, [router, shouldUseDiscoverHome]);

  if (user === undefined || isLoading || isStaff || shouldUseDiscoverHome) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl" role="status">
          <Skeleton className="h-8 w-48" aria-hidden />
          <Skeleton className="h-40 w-full rounded-2xl" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("common.loadingData")}</p>
        </div>
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
