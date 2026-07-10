"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Filter, LayoutGrid, Layers } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchFilters } from "@/components/matches/match-filters";
import { MatchProfileModal } from "@/components/matches/match-profile-modal";
import { MatchSwipeDeck } from "@/components/matches/match-swipe-deck";
import { MatchProfileCard } from "@/components/matches/match-profile-card";
import { ProfileLockedGate } from "@/components/profile/profile-locked-gate";
import { PaymentGate } from "@/components/payment/payment-gate";
import type { MatchResult, Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { hasPaidAccess, isPremiumMember } from "@/lib/access";
import { useStaffRedirect } from "@/hooks/use-staff-redirect";
import { isMemberProfileReady } from "@/lib/profile-progress";
import { isInTrialPeriod, isTrialExpired } from "@/lib/trial";
import { TrialBanner } from "@/components/payment/trial-banner";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { useMarkNotificationsRead } from "@/hooks/use-mark-notifications-read";

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
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"swipe" | "browse">("swipe");
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;

  const profileReady = !!profile && isMemberProfileReady(profile, preferences);
  const canQuery = profileReady && hasPaidAccess(profile);
  const isPremium = isPremiumMember(profile);

  useMarkNotificationsRead(["match", "approval"], canQuery);

  const filterArgs = useMemo(() => buildFilterArgs(filters), [filters]);

  const discoverMatches = useQuery(
    api.matches.getMatches,
    canQuery ? filterArgs : "skip"
  ) as MatchResult[] | undefined;

  const likeUser = useMutation(api.matches.likeUser);

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

  if (profile === undefined || staffLoading || isStaff) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-lg mx-auto space-y-4" role="status">
          <Skeleton className="h-[36rem] w-full rounded-2xl" aria-hidden />
          <p className="text-center text-sm text-muted-foreground">{t("common.loadingData")}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (profile && (!profile.questionnaireComplete || !profileReady)) {
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
              variant={viewMode === "swipe" ? "default" : "outline"}
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => setViewMode("swipe")}
              aria-label={t("matchesPage.viewSwipe")}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "browse" ? "default" : "outline"}
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => setViewMode("browse")}
              aria-label={t("matchesPage.viewBrowse")}
            >
              <LayoutGrid className="h-4 w-4" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matchList.map((match, i) => (
              <MatchProfileCard
                key={match.userId}
                match={match}
                index={i}
                onView={() => setSelectedMatch(match)}
                onAction={(action) => void handleAction(match.userId, action)}
              />
            ))}
          </div>
        ) : (
          <MatchSwipeDeck
            matches={matchList}
            startUserId={focusUserId}
            onView={setSelectedMatch}
            onAction={handleAction}
          />
        )}
      </div>

      {selectedMatch && (
        <MatchProfileModal
          match={selectedMatch}
          isPremium={isPremium}
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
        />
      )}
    </DashboardLayout>
  );
}
