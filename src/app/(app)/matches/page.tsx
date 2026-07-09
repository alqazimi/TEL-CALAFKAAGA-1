"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Filter, List } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchFilters } from "@/components/matches/match-filters";
import { MatchProfileModal } from "@/components/matches/match-profile-modal";
import { MatchSwipeDeck } from "@/components/matches/match-swipe-deck";
import {
  MatchListsSheet,
  type SecondaryMatchList,
} from "@/components/matches/match-lists-sheet";
import { ProfileLockedGate } from "@/components/profile/profile-locked-gate";
import { PendingApprovalGate } from "@/components/profile/pending-approval-gate";
import { PaymentGate } from "@/components/payment/payment-gate";
import type { MatchResult, Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { hasPaidAccess, isPremiumMember } from "@/lib/access";
import { isInTrialPeriod, isTrialExpired } from "@/lib/trial";
import { TrialBanner } from "@/components/payment/trial-banner";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";

function buildFilterArgs(filters: Record<string, string>) {
  return {
    country: filters.country || undefined,
    city: filters.city || undefined,
    minAge: filters.minAge ? parseInt(filters.minAge) : undefined,
    maxAge: filters.maxAge ? parseInt(filters.maxAge) : undefined,
    minHeight: filters.minHeight ? parseInt(filters.minHeight) : undefined,
    maxHeight: filters.maxHeight ? parseInt(filters.maxHeight) : undefined,
    religiousLevel: filters.religiousLevel || undefined,
    education: filters.education || undefined,
    occupation: filters.occupation || undefined,
    maritalStatus: filters.maritalStatus || undefined,
    marriageTimeline: filters.marriageTimeline || undefined,
    children:
      filters.children !== undefined && filters.children !== ""
        ? parseInt(filters.children)
        : undefined,
  };
}

export default function MatchesPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [listsOpen, setListsOpen] = useState(false);
  const [activeList, setActiveList] = useState<SecondaryMatchList>("shortlist");

  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;

  const canQuery =
    profile?.questionnaireComplete && profile.approved && hasPaidAccess(profile);
  const isPremium = isPremiumMember(profile);

  const filterArgs = useMemo(() => buildFilterArgs(filters), [filters]);

  const discoverMatches = useQuery(
    api.matches.getMatches,
    canQuery ? filterArgs : "skip"
  ) as MatchResult[] | undefined;

  const shortlistMatches = useQuery(
    api.matches.getShortlistedProfiles,
    canQuery ? filterArgs : "skip"
  ) as MatchResult[] | undefined;

  const likedMatches = useQuery(
    api.matches.getSentLikes,
    canQuery ? filterArgs : "skip"
  ) as MatchResult[] | undefined;

  const likedYouMatches = useQuery(
    api.matches.getReceivedLikes,
    canQuery && isPremium ? filterArgs : "skip"
  ) as MatchResult[] | undefined;

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
      }
    } catch {
      toast.error(t("matchesPage.errorToast"));
    }
  };

  const listCounts =
    (shortlistMatches?.length ?? 0) +
    (likedMatches?.length ?? 0) +
    (isPremium ? likedYouMatches?.length ?? 0 : 0);

  if (profile === undefined) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-lg mx-auto space-y-4" role="status">
          <Skeleton className="h-[36rem] w-full rounded-2xl" aria-hidden />
          <p className="text-center text-sm text-muted-foreground">{t("common.loadingData")}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (profile && !profile.questionnaireComplete) {
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

  if (discoverMatches === undefined) {
    return (
      <DashboardLayout>
        <Skeleton className="h-[36rem] w-full max-w-lg mx-auto rounded-2xl" />
      </DashboardLayout>
    );
  }

  const matchList = discoverMatches;
  const matchLabel = matchList.length === 1 ? t("matchesPage.match") : t("matchesPage.matches");

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-lg mx-auto">
        {profile && isInTrialPeriod(profile) && <TrialBanner profile={profile} />}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{t("matchesPage.discoverTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("matchesPage.compatible", { count: matchList.length, label: matchLabel })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setListsOpen(true)}
            >
              <List className="h-4 w-4 mr-1.5" />
              {t("matchesPage.openLists")}
              {listCounts > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
                  {listCounts}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => setShowFilters(!showFilters)}
              aria-label={t("matchesPage.filters")}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && <MatchFilters filters={filters} onChange={setFilters} />}

        {matchList.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">{t("matchesPage.noMatchesTitle")}</h3>
            <p className="text-muted-foreground text-sm">{t("matchesPage.noMatchesDesc")}</p>
          </Card>
        ) : (
          <MatchSwipeDeck
            matches={matchList}
            onView={setSelectedMatch}
            onAction={handleAction}
          />
        )}
      </div>

      <MatchListsSheet
        open={listsOpen}
        onClose={() => setListsOpen(false)}
        activeList={activeList}
        onListChange={setActiveList}
        shortlist={shortlistMatches ?? []}
        liked={likedMatches ?? []}
        likedYou={likedYouMatches ?? []}
        isPremium={isPremium}
        onView={setSelectedMatch}
        onAction={handleAction}
      />

      {selectedMatch && (
        <MatchProfileModal
          match={selectedMatch}
          isPremium={isPremium}
          onClose={() => setSelectedMatch(null)}
          onLike={(action) => {
            handleAction(selectedMatch.userId, action);
            setSelectedMatch(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
