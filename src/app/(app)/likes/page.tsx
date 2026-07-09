"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
import { isMemberOnboardingProfile, useStaffRedirect } from "@/hooks/use-staff-redirect";
import { isTrialExpired } from "@/lib/trial";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { useMarkNotificationsRead } from "@/hooks/use-mark-notifications-read";

export default function LikesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isStaff, isLoading: staffLoading } = useStaffRedirect();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;

  const canQuery =
    profile?.questionnaireComplete && profile.approved && hasPaidAccess(profile);
  const isPremium = isPremiumMember(profile);

  const matchLists = useQuery(
    api.matches.getMatchLists,
    canQuery ? {} : "skip"
  );

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

  const likeUser = useMutation(api.matches.likeUser);

  const handleAction = async (
    userId: Id<"users">,
    action: "like" | "pass" | "shortlist"
  ) => {
    try {
      const result = await likeUser({ toUserId: userId, action });
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

  if (profile === undefined || staffLoading || isStaff) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-lg mx-auto space-y-4" role="status">
          <Skeleton className="h-64 w-full rounded-2xl" aria-hidden />
          <p className="text-center text-sm text-muted-foreground">{t("common.loadingData")}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (profile && isMemberOnboardingProfile(profile)) {
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
          title={
            isTrialExpired(profile)
              ? t("payment.trialEndedTitle")
              : t("payment.profileReadyTitle")
          }
          description={
            isTrialExpired(profile)
              ? t("payment.trialEndedDesc", {
                  basic: REGISTRATION_PRICE,
                  premium: PERSONAL_SUPPORT_PRICE,
                })
              : t("payment.profileReadyDesc", {
                  basic: REGISTRATION_PRICE,
                  premium: PERSONAL_SUPPORT_PRICE,
                })
          }
        />
      </DashboardLayout>
    );
  }

  if (profile && !profile.approved) {
    return (
      <DashboardLayout>
        <PendingApprovalGate isPremium={isPremiumMember(profile)} />
      </DashboardLayout>
    );
  }

  if (matchLists === undefined) {
    return (
      <DashboardLayout>
        <Skeleton className="h-64 w-full max-w-lg mx-auto rounded-2xl" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-semibold">{t("app.likes")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
