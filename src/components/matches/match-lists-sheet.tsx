"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Heart, Sparkles, X } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { MatchProfileCard } from "@/components/matches/match-profile-card";
import { PremiumUpgradeButton } from "@/components/premium/premium-upgrade-button";
import type { MatchResult } from "@/types";
import { PREMIUM_UPGRADE_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export type SecondaryMatchList = "shortlist" | "liked" | "likedYou";

interface MatchListsSheetProps {
  open: boolean;
  onClose: () => void;
  activeList: SecondaryMatchList;
  onListChange: (list: SecondaryMatchList) => void;
  shortlist: MatchResult[];
  liked: MatchResult[];
  likedYou: MatchResult[];
  isPremium: boolean;
  onView: (match: MatchResult) => void;
  onAction: (userId: Id<"users">, action: "like" | "pass" | "shortlist") => void;
}

const LIST_META: Record<
  SecondaryMatchList,
  { icon: typeof Bookmark; premium?: boolean }
> = {
  shortlist: { icon: Bookmark },
  liked: { icon: Heart },
  likedYou: { icon: Sparkles, premium: true },
};

export function MatchListsSheet({
  open,
  onClose,
  activeList,
  onListChange,
  shortlist,
  liked,
  likedYou,
  isPremium,
  onView,
  onAction,
}: MatchListsSheetProps) {
  const { t } = useTranslation();

  const lists: Record<SecondaryMatchList, MatchResult[]> = {
    shortlist,
    liked,
    likedYou,
  };

  const current = lists[activeList];
  const locked = activeList === "likedYou" && !isPremium;

  const emptyTitle =
    activeList === "shortlist"
      ? t("matchesPage.noShortlistTitle")
      : activeList === "liked"
        ? t("matchesPage.noLikedTitle")
        : t("matchesPage.noLikedYouTitle");

  const emptyDesc =
    activeList === "shortlist"
      ? t("matchesPage.noShortlistDesc")
      : activeList === "liked"
        ? t("matchesPage.noLikedDesc")
        : t("matchesPage.noLikedYouDesc");

  const tabLabels: Record<SecondaryMatchList, string> = {
    shortlist: t("matchesPage.tabShortlist"),
    liked: t("matchesPage.tabLiked"),
    likedYou: t("matchesPage.tabLikedYou"),
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            aria-label={t("common.a11yClose")}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(88vh,720px)] flex-col rounded-t-3xl border border-border bg-card shadow-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold">{t("matchesPage.yourLists")}</h2>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex gap-2 px-5 py-3 border-b border-border overflow-x-auto">
              {(Object.keys(LIST_META) as SecondaryMatchList[]).map((id) => {
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
                      <span className={cn("ml-1.5 text-xs", activeList === id ? "opacity-90" : "text-muted-foreground")}>
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

            <div className="flex-1 overflow-y-auto p-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {current.map((match, i) => (
                    <MatchProfileCard
                      key={match.userId}
                      match={match}
                      index={i}
                      onView={() => {
                        onView(match);
                        onClose();
                      }}
                      onAction={(action) => onAction(match.userId, action)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
