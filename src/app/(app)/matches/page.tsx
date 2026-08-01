"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Filter, LayoutGrid, Layers } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MemberDataLoading } from "@/components/auth/member-data-loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataLoadError } from "@/components/ui/data-load-error";
import { MatchFilters } from "@/components/matches/match-filters";
import { MatchProfileModal } from "@/components/matches/match-profile-modal";
import { MatchSwipeDeck } from "@/components/matches/match-swipe-deck";
import { MatchProfileCard } from "@/components/matches/match-profile-card";
import { ProfileLockedGate } from "@/components/profile/profile-locked-gate";
import { PendingApprovalGate } from "@/components/profile/pending-approval-gate";
import { AccountLockedGate } from "@/components/profile/account-locked-gate";
import { PaymentGate } from "@/components/payment/payment-gate";
import type { MatchResult, Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { hasPaidAccess, isPremiumMember } from "@/lib/access";
import {
  needsApprovalGate,
  isInteractionLocked,
  resolveReviewStatus,
} from "@/lib/review-status";
import { useStaffRedirect } from "@/hooks/use-staff-redirect";
import { isMemberProfileReady, isProfileQueriesLoading } from "@/lib/profile-progress";
import { isInTrialPeriod, isTrialExpired } from "@/lib/trial";
import { TrialBanner } from "@/components/payment/trial-banner";
import { formatMoney, planPricesForGender } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { useMarkNotificationsRead } from "@/hooks/use-mark-notifications-read";
import { useProfile, usePreferencesQuery } from "@/data/profile/hooks";
import { useMatches, useLikeUser, useStartChat } from "@/data/matching/hooks";

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
  const router = useRouter();
  const { isStaff, isLoading: staffLoading } = useStaffRedirect();
  const searchParams = useSearchParams();
  const focusUserId = searchParams.get("user") ?? undefined;
  const openedFocusRef = useRef<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"swipe" | "browse">("browse");
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 350);
    return () => clearTimeout(timer);
  }, [filters]);

  const {
    profile: profileRaw,
    error: profileError,
    refresh: refreshProfile,
  } = useProfile();
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
    profileReady &&
    hasPaidAccess(profile) &&
    !needsApprovalGate(profile) &&
    !isInteractionLocked(profile);
  const isPremium = isPremiumMember(profile);

  useMarkNotificationsRead(["match", "approval"], canQuery);

  const filterArgs = useMemo(() => buildFilterArgs(debouncedFilters), [debouncedFilters]);

  const {
    matches: discoverMatchesRaw,
    isRefreshing: matchesRefreshing,
    error: matchesError,
    refresh: refreshMatches,
  } = useMatches(filterArgs, canQuery);
  const discoverMatches = (
    canQuery && Array.isArray(discoverMatchesRaw) ? discoverMatchesRaw : undefined
  ) as MatchResult[] | undefined;
  const [hiddenUserIds, setHiddenUserIds] = useState<Set<string>>(() => new Set());

  const likeUser = useLikeUser();
  const startChat = useStartChat();

  // Open the profile the user tapped on the dashboard (?user=).
  useEffect(() => {
    if (!focusUserId || !discoverMatches?.length) return;
    if (openedFocusRef.current === focusUserId) return;
    const match = discoverMatches.find((m) => m.userId === focusUserId);
    if (match) {
      setSelectedMatch(match);
      openedFocusRef.current = focusUserId;
    }
  }, [focusUserId, discoverMatches]);

  const openChatFromResult = (result: {
    matched?: boolean;
    mutual?: boolean;
    conversationId?: string | null;
  }) => {
    const conversationId =
      typeof result.conversationId === "string" ? result.conversationId : null;
    if (result.mutual) {
      toast.success(t("matchesPage.matchedToast"));
    } else if (result.matched || conversationId) {
      toast.success(t("matchesPage.chatReadyToast"));
    }
    if (conversationId) {
      router.push(`/chat?c=${encodeURIComponent(conversationId)}`);
    }
  };

  const handleAction = async (
    userId: string,
    action: "like" | "pass" | "shortlist"
  ) => {
    if (actionBusyId === userId) return;
    setActionBusyId(userId);
    const hideCard = action === "pass" || action === "like";
    if (hideCard) {
      setHiddenUserIds((prev) => new Set(prev).add(userId));
    }
    try {
      const result = (await likeUser({ toUserId: userId, action })) as {
        matched?: boolean;
        mutual?: boolean;
        conversationId?: string | null;
      };
      if (action === "like" && (result.matched || result.conversationId)) {
        openChatFromResult(result);
      } else if (action === "shortlist") {
        toast.success(t("matchesPage.shortlistedToast"));
      } else if (action === "pass") {
        toast.message(t("matchesPage.passedToast"));
      }
    } catch {
      if (hideCard) {
        setHiddenUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
      toast.error(t("matchesPage.errorToast"));
    } finally {
      setActionBusyId(null);
    }
  };

  const handleMessage = async (userId: string) => {
    if (actionBusyId === userId) return;
    setActionBusyId(userId);
    try {
      const result = (await startChat(userId)) as {
        matched?: boolean;
        mutual?: boolean;
        conversationId?: string | null;
      };
      openChatFromResult(result);
      setSelectedMatch(null);
      if (focusUserId) {
        router.replace("/matches", { scroll: false });
      }
    } catch {
      toast.error(t("matchesPage.errorToast"));
    } finally {
      setActionBusyId(null);
    }
  };

  if (staffLoading || isStaff) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-6xl mx-auto space-y-4" role="status" aria-busy>
          <Skeleton className="h-[36rem] w-full rounded-2xl" aria-hidden />
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

  if (!isStaff && profileError && !profile) {
    return (
      <DashboardLayout>
        <DataLoadError
          message={profileError}
          onRetry={() => void refreshProfile()}
        />
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

  if (profile && isInteractionLocked(profile)) {
    const status = profile.banned
      ? "banned"
      : resolveReviewStatus(profile) === "paused"
        ? "paused"
        : "suspended";
    return (
      <DashboardLayout>
        <AccountLockedGate status={status} />
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

  if (canQuery && matchesError && discoverMatches === undefined) {
    return (
      <DashboardLayout>
        <DataLoadError
          message={matchesError}
          onRetry={() => void refreshMatches()}
        />
      </DashboardLayout>
    );
  }

  if (discoverMatches === undefined && !matchesRefreshing) {
    return (
      <DashboardLayout>
        <Skeleton className="h-[36rem] w-full max-w-2xl mx-auto rounded-2xl" />
      </DashboardLayout>
    );
  }

  const matchList = (discoverMatches ?? []).filter(
    (m) => !hiddenUserIds.has(m.userId)
  );
  const matchLabel = matchList.length === 1 ? t("matchesPage.match") : t("matchesPage.matches");

  return (
    <DashboardLayout>
      <div className="space-y-5 mx-auto w-full max-w-6xl">
        {profile && isInTrialPeriod(profile) && <TrialBanner profile={profile} />}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">{t("matchesPage.discoverTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1 sm:text-base">
              {t("matchesPage.compatible", { count: matchList.length, label: matchLabel })}
            </p>
            {matchList.length > 0 ? (
              <p className="text-xs text-muted-foreground mt-1.5 sm:text-sm">
                {viewMode === "browse"
                  ? t("matchesPage.browseHint")
                  : t("matchesPage.swipeModeHint")}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant={viewMode === "browse" ? "default" : "outline"}
              size="sm"
              className="rounded-full shrink-0 gap-1.5 px-3"
              onClick={() => setViewMode("browse")}
              aria-label={t("matchesPage.viewBrowse")}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">{t("matchesPage.viewBrowseShort")}</span>
            </Button>
            <Button
              variant={viewMode === "swipe" ? "default" : "outline"}
              size="sm"
              className="rounded-full shrink-0 gap-1.5 px-3"
              onClick={() => setViewMode("swipe")}
              aria-label={t("matchesPage.viewSwipe")}
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">{t("matchesPage.viewSwipeShort")}</span>
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
        ) : viewMode === "browse" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {matchList.map((match, i) => (
              <MatchProfileCard
                key={match.userId}
                match={match}
                index={i}
                busy={actionBusyId === match.userId}
                onView={() => setSelectedMatch(match)}
                onAction={(action) => void handleAction(match.userId, action)}
                onMessage={() => void handleMessage(match.userId)}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-xl lg:max-w-2xl">
            <MatchSwipeDeck
              matches={matchList}
              startUserId={focusUserId}
              actionBusyId={actionBusyId}
              onView={setSelectedMatch}
              onAction={handleAction}
              onMessage={(userId) => handleMessage(userId)}
            />
          </div>
        )}
      </div>

      {selectedMatch && (
        <MatchProfileModal
          match={selectedMatch}
          isPremium={isPremium}
          busy={actionBusyId === selectedMatch.userId}
          onClose={() => {
            setSelectedMatch(null);
            if (focusUserId) {
              router.replace("/matches", { scroll: false });
            }
          }}
          onLike={(action) => {
            void handleAction(selectedMatch.userId, action);
            setSelectedMatch(null);
            if (focusUserId) {
              router.replace("/matches", { scroll: false });
            }
          }}
          onMessage={() => {
            void handleMessage(selectedMatch.userId);
          }}
        />
      )}
    </DashboardLayout>
  );
}
