"use client";

import { Bookmark, Heart, Sparkles, X } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { MatchProfileCard } from "@/components/matches/match-profile-card";
import { PremiumUpgradeButton } from "@/components/premium/premium-upgrade-button";
import type { MatchResult } from "@/types";
import { PREMIUM_UPGRADE_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export type SecondaryMatchList = "shortlist" | "liked" | "likedYou" | "passed";

const LIST_META: Record<
  SecondaryMatchList,
  { icon: typeof Bookmark; premium?: boolean }
> = {
  shortlist: { icon: Bookmark },
  liked: { icon: Heart },
  passed: { icon: X },
  likedYou: { icon: Sparkles, premium: true },
};

const LIST_IDS = Object.keys(LIST_META) as SecondaryMatchList[];

export function isSecondaryMatchList(value: string | null): value is SecondaryMatchList {
  return value !== null && LIST_IDS.includes(value as SecondaryMatchList);
}

interface MatchListsViewProps {
  activeList: SecondaryMatchList;
  onListChange: (list: SecondaryMatchList) => void;
  shortlist: MatchResult[];
  liked: MatchResult[];
  likedYou: MatchResult[];
  passed: MatchResult[];
  isPremium: boolean;
  onView: (match: MatchResult) => void;
  onAction: (userId: Id<"users">, action: "like" | "pass" | "shortlist") => void;
}

export function MatchListsView({
  activeList,
  onListChange,
  shortlist,
  liked,
  likedYou,
  passed,
  isPremium,
  onView,
  onAction,
}: MatchListsViewProps) {
  const { t } = useTranslation();

  const lists: Record<SecondaryMatchList, MatchResult[]> = {
    shortlist,
    liked,
    likedYou,
    passed,
  };

  const current = lists[activeList];
  const locked = activeList === "likedYou" && !isPremium;

  const emptyTitle =
    activeList === "shortlist"
      ? t("matchesPage.noShortlistTitle")
      : activeList === "liked"
        ? t("matchesPage.noLikedTitle")
        : activeList === "passed"
          ? t("matchesPage.noPassedTitle")
          : t("matchesPage.noLikedYouTitle");

  const emptyDesc =
    activeList === "shortlist"
      ? t("matchesPage.noShortlistDesc")
      : activeList === "liked"
        ? t("matchesPage.noLikedDesc")
        : activeList === "passed"
          ? t("matchesPage.noPassedDesc")
          : t("matchesPage.noLikedYouDesc");

  const tabLabels: Record<SecondaryMatchList, string> = {
    shortlist: t("matchesPage.tabShortlist"),
    liked: t("matchesPage.tabLiked"),
    passed: t("matchesPage.tabPassed"),
    likedYou: t("matchesPage.tabLikedYou"),
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {LIST_IDS.map((id) => {
          const meta = LIST_META[id];
          const Icon = meta.icon;
          const count = lists[id].length;
          return (
            <Button
              key={id}
              variant={activeList === id ? "default" : "outline"}
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => onListChange(id)}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {tabLabels[id]}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1.5 text-xs",
                    activeList === id ? "opacity-90" : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
              {meta.premium && !isPremium && (
                <span className="ml-1 text-[10px] opacity-70">✦</span>
              )}
            </Button>
          );
        })}
      </div>

      <div className="mt-5">
        {locked ? (
          <div className="text-center py-10 space-y-4">
            <Sparkles className="h-10 w-10 text-primary/50 mx-auto" />
            <h3 className="font-semibold">{t("premium.likedYouLockedTitle")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {t("premium.likedYouLockedDesc", { price: PREMIUM_UPGRADE_PRICE })}
            </p>
            <PremiumUpgradeButton className="mx-auto" />
          </div>
        ) : current.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-semibold">{emptyTitle}</p>
            <p className="text-sm text-muted-foreground mt-2">{emptyDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {current.map((match, i) => (
              <MatchProfileCard
                key={match.userId}
                match={match}
                index={i}
                onView={() => onView(match)}
                onAction={(action) => onAction(match.userId, action)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
