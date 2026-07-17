"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MemberDataLoading } from "@/components/auth/member-data-loading";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchProfileModal } from "@/components/matches/match-profile-modal";
import {
  isSecondaryMatchList,
  MatchListsView,
  type SecondaryMatchList,
} from "@/components/matches/match-lists-view";
import { ProfileLockedGate } from "@/components/profile/profile-locked-gate";
import { PendingApprovalGate } from "@/components/profile/pending-approval-gate";
import { PaymentGate } from "@/components/payment/payment-gate";
import type { MatchResult, Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { hasPaidAccess, isPremiumMember } from "@/lib/access";
import { needsApprovalGate } from "@/lib/review-status";
import { useStaffRedirect } from "@/hooks/use-staff-redirect";
import { isMemberProfileReady, isProfileQueriesLoading } from "@/lib/profile-progress";
import { isTrialExpired } from "@/lib/trial";
import { formatMoney, planPricesForGender } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { useMarkNotificationsRead } from "@/hooks/use-mark-notifications-read";
import { useProfile, usePreferencesQuery } from "@/data/profile/hooks";
import { useMatchLists, useLikeUser } from "@/data/matching/hooks";

export default function LikesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isStaff, isLoading: staffLoading } = useStaffRedirect();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  const { profile: profileRaw } = useProfile();
  const profile = (
    staffLoading || isStaff ? undefined : profileRaw
  ) as Profile | null | undefined;
  const preferencesRaw = usePreferencesQuery();
  const preferences = (
    staffLoading || isStaff ? undefined : preferencesRaw
  ) as Preferences | null | undefined;
  const queriesLoading =
    !isStaff && isProfileQueriesLoading(profile, preferences);

  const profileReady =
    !!profile &&
    !queriesLoading &&
    (profile.questionnaireComplete || isMemberProfileReady(profile, preferences));
  const canQuery =
    profileReady && hasPaidAccess(profile) && !needsApprovalGate(profile);
  const isPremium = isPremiumMember(profile);

  const matchListsRaw = useMatchLists({}, canQuery);
  const matchLists = (canQuery ? matchListsRaw : undefined) as
    | {
        shortlist?: MatchResult[];
        liked?: MatchResult[];
        likedYou?: MatchResult[];
        passed?: MatchResult[];
      }
    | undefined;

  const shortlistMatches = matchLists?.shortlist;
  const likedMatches = matchLists?.liked;
  const likedYouMatches = matchLists?.likedYou;
  const passedMatches = matchLists?.passed;

  const defaultTab: SecondaryMatchList = isPremium ? "likedYou" : "liked";
  const activeList = isSecondaryMatchList(tabParam) ? tabParam : defaultTab;

  useMarkNotificationsRead(
    activeList === "likedYou" ? ["like"] : activeList === "liked" ? ["match"] : [],
    canQuery
  );

  const setActiveList = useCallback(
    (list: SecondaryMatchList) => {
      router.replace(`/likes?tab=${list}`, { scroll: false });
    },
    [router]
  );

  const likeUser = useLikeUser();

  const handleAction = async (
    userId: string,
    action: "like" | "pass" | "shortlist"
  ) => {
    try {
      const result = (await likeUser({ toUserId: userId, action })) as {
        matched?: boolean;
      };
      if (result.matched) {
        toast.success(t("matchesPage.matchedToast"));
      } else if (action === "like") {
        toast.success(t("matchesPage.likedToast"));
      } else if (action === "shortlist") {
        toast.success(t("matchesPage.shortlistedToast"));
      } else if (action === "pass") {
        toast.message(t("matchesPage.passedToast"));
      }
    } catch {
      toast.error(t("matchesPage.errorToast"));
    }
  };

  const listCounts = useMemo(
    () =>
      (shortlistMatches?.length ?? 0) +
      (likedMatches?.length ?? 0) +
      (passedMatches?.length ?? 0) +
      (isPremium ? likedYouMatches?.length ?? 0 : 0),
    [shortlistMatches, likedMatches, passedMatches, likedYouMatches, isPremium]
  );

  if (staffLoading || isStaff) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-6xl mx-auto space-y-4" role="status" aria-busy>
          <Skeleton className="h-64 w-full rounded-2xl" aria-hidden />
        </div>
      </DashboardLayout>
    );
  }

  if (queriesLoading) {
    return (
      <DashboardLayout>
        <MemberDataLoading pending />
      </DashboardLayout>
    );
  }

  if (profile && !profileReady) {
    return (
      <DashboardLayout>
        <ProfileLockedGate profile={profile} preferences={preferences} />
      </DashboardLayout>
    );
  }

  if (profile && !hasPaidAccess(profile)) {
    return (
      <DashboardLayout>
        <PaymentGate
          gender={profile.gender === "female" || profile.gender === "male" ? profile.gender : undefined}
          title={
            isTrialExpired(profile)
              ? t("payment.trialEndedTitle")
              : t("payment.profileReadyTitle")
          }
          description={
            isTrialExpired(profile)
              ? t("payment.trialEndedDesc", {
                  basic: formatMoney(planPricesForGender(profile.gender).basic),
                  premium: formatMoney(planPricesForGender(profile.gender).premium),
                })
              : t("payment.profileReadyDesc", {
                  basic: formatMoney(planPricesForGender(profile.gender).basic),
                  premium: formatMoney(planPricesForGender(profile.gender).premium),
                })
          }
        />
      </DashboardLayout>
    );
  }

  if (profile && needsApprovalGate(profile)) {
    return (
      <DashboardLayout>
        <PendingApprovalGate isPremium={isPremium} />
      </DashboardLayout>
    );
  }

  if (matchLists === undefined) {
    return (
      <DashboardLayout>
        <Skeleton className="h-64 w-full max-w-6xl mx-auto rounded-2xl" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 mx-auto w-full max-w-6xl">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{t("app.likes")}</h1>
          <p className="text-sm text-muted-foreground mt-1 sm:text-base">
            {listCounts > 0
              ? t("likesPage.summary", { count: listCounts })
              : t("likesPage.summaryEmpty")}
          </p>
        </div>

        <MatchListsView
          activeList={activeList}
          onListChange={setActiveList}
          shortlist={shortlistMatches ?? []}
          liked={likedMatches ?? []}
          likedYou={likedYouMatches ?? []}
          passed={passedMatches ?? []}
          isPremium={isPremium}
          onView={setSelectedMatch}
          onAction={handleAction}
        />
      </div>

      {selectedMatch && (
        <MatchProfileModal
          match={selectedMatch}
          isPremium={isPremium}
          onClose={() => setSelectedMatch(null)}
          onLike={(action) => {
            void handleAction(selectedMatch.userId, action);
            setSelectedMatch(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
