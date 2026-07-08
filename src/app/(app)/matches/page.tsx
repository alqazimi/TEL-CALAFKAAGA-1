"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Heart, Filter } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchFilters } from "@/components/matches/match-filters";
import { MatchProfileModal } from "@/components/matches/match-profile-modal";
import { MatchProfileCard } from "@/components/matches/match-profile-card";
import { MatchSwipeDeck } from "@/components/matches/match-swipe-deck";
import { ProfileLockedGate } from "@/components/profile/profile-locked-gate";
import { PendingApprovalCard } from "@/components/profile/pending-approval-card";
import { PaymentGate } from "@/components/payment/payment-gate";
import type { MatchResult, Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { hasPaidAccess } from "@/lib/access";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type MatchTab = "discover" | "shortlist" | "liked";

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
  const [tab, setTab] = useState<MatchTab>("discover");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;

  const canQuery =
    profile?.questionnaireComplete && profile.approved && hasPaidAccess(profile);

  const filterArgs = useMemo(() => buildFilterArgs(filters), [filters]);

  const discoverMatches = useQuery(
    api.matches.getMatches,
    canQuery && tab === "discover" ? filterArgs : "skip"
  ) as MatchResult[] | undefined;

  const shortlistMatches = useQuery(
    api.matches.getShortlistedProfiles,
    canQuery && tab === "shortlist" ? filterArgs : "skip"
  ) as MatchResult[] | undefined;

  const likedMatches = useQuery(
    api.matches.getSentLikes,
    canQuery && tab === "liked" ? filterArgs : "skip"
  ) as MatchResult[] | undefined;

  const matches =
    tab === "discover"
      ? discoverMatches
      : tab === "shortlist"
        ? shortlistMatches
        : likedMatches;

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

  if (profile === undefined) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
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
          title={t("payment.profileReadyTitle")}
          description={t("payment.profileReadyDesc", {
            basic: REGISTRATION_PRICE,
            premium: PERSONAL_SUPPORT_PRICE,
          })}
        />
      </DashboardLayout>
    );
  }

  if (profile && !profile.approved) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <PendingApprovalCard />
        </div>
      </DashboardLayout>
    );
  }

  if (matches === undefined) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const matchLabel = matches.length === 1 ? t("matchesPage.match") : t("matchesPage.matches");
  const emptyTitle =
    tab === "shortlist"
      ? t("matchesPage.noShortlistTitle")
      : tab === "liked"
        ? t("matchesPage.noLikedTitle")
        : t("matchesPage.noMatchesTitle");
  const emptyDesc =
    tab === "shortlist"
      ? t("matchesPage.noShortlistDesc")
      : tab === "liked"
        ? t("matchesPage.noLikedDesc")
        : t("matchesPage.noMatchesDesc");

  const tabs: { id: MatchTab; label: string }[] = [
    { id: "discover", label: t("matchesPage.tabDiscover") },
    { id: "shortlist", label: t("matchesPage.tabShortlist") },
    { id: "liked", label: t("matchesPage.tabLiked") },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <Button
                key={item.id}
                variant={tab === item.id ? "default" : "outline"}
                size="sm"
                className={cn("rounded-full")}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            {t("matchesPage.filters")}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("matchesPage.compatible", { count: matches.length, label: matchLabel })}
        </p>

        {showFilters && <MatchFilters filters={filters} onChange={setFilters} />}

        {matches.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">{emptyTitle}</h3>
            <p className="text-muted-foreground">{emptyDesc}</p>
          </Card>
        ) : tab === "discover" ? (
          <>
            <div className="md:hidden">
              <MatchSwipeDeck
                matches={matches}
                onView={setSelectedMatch}
                onAction={handleAction}
              />
            </div>
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, i) => (
                <MatchProfileCard
                  key={match.userId}
                  match={match}
                  index={i}
                  onView={() => setSelectedMatch(match)}
                  onAction={(action) => handleAction(match.userId, action)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match, i) => (
              <MatchProfileCard
                key={match.userId}
                match={match}
                index={i}
                onView={() => setSelectedMatch(match)}
                onAction={(action) => handleAction(match.userId, action)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedMatch && (
        <MatchProfileModal
          match={selectedMatch}
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
