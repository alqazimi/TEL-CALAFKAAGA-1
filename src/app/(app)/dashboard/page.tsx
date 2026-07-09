"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { CurrentUser, MatchResult, MutualMatch } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import { NextStepCard } from "@/components/dashboard/next-step-card";
import { hasPaidAccess, isStaffRole } from "@/lib/access";
import { useTranslation } from "@/lib/i18n/context";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useQuery(api.users.currentUser) as CurrentUser | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;
  const isStaff = isStaffRole(user?.profile?.role);
  const canViewMatches =
    user?.profile?.questionnaireComplete &&
    !isStaff &&
    user?.profile?.approved &&
    hasPaidAccess(user?.profile);
  const matches = useQuery(
    api.matches.getMatches,
    canViewMatches ? {} : "skip"
  ) as MatchResult[] | undefined;
  const myMatches = useQuery(
    api.matches.getMyMatches,
    canViewMatches ? undefined : "skip"
  ) as MutualMatch[] | undefined;

  useEffect(() => {
    if (isStaff) {
      router.replace("/admin");
    }
  }, [isStaff, router]);

  if (user === undefined || isStaff) {
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

  const profile = user?.profile;
  const firstName = profile?.name?.split(" ")[0] ?? t("dashboard.guestName");
  const isComplete = profile?.questionnaireComplete ?? false;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {t("dashboard.hello", { name: firstName })}
          </h1>
        </div>

        {user && <NextStepCard user={user} matches={matches} mutualCount={myMatches?.length ?? 0} />}

        {profile && !isComplete && (
          <ProfileCompletionCard profile={profile} preferences={preferences} />
        )}
      </div>
    </DashboardLayout>
  );
}
