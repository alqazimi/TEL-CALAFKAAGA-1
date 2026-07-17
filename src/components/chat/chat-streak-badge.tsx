"use client";

import { Flame } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export type ChatStreakInfo = {
  count?: number;
  longest?: number;
  atRisk?: boolean;
  youSentToday?: boolean;
  partnerSentToday?: boolean;
  bothSentToday?: boolean;
};

interface ChatStreakBadgeProps {
  streak?: ChatStreakInfo | null;
  compact?: boolean;
  className?: string;
}

export function ChatStreakBadge({
  streak,
  compact = false,
  className,
}: ChatStreakBadgeProps) {
  const { t } = useTranslation();
  const count = streak?.count ?? 0;
  if (count <= 0 && !streak?.youSentToday && !streak?.partnerSentToday) {
    return null;
  }

  const displayCount = Math.max(count, 0);
  const atRisk = !!streak?.atRisk;
  const waitingOnYou =
    !streak?.youSentToday && (!!streak?.partnerSentToday || atRisk);
  const label =
    displayCount > 0
      ? t("chatPage.streakDays", { count: displayCount })
      : t("chatPage.streakStart");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        atRisk || waitingOnYou
          ? "border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
          : "border-orange-300/70 bg-gradient-to-r from-orange-50 to-rose-50 text-orange-700 dark:border-orange-800 dark:from-orange-950/40 dark:to-rose-950/30 dark:text-orange-200",
        className
      )}
      title={
        waitingOnYou
          ? t("chatPage.streakSendPhoto")
          : streak?.bothSentToday
            ? t("chatPage.streakSafeToday")
            : t("chatPage.streakHint")
      }
    >
      <Flame
        className={cn(
          "h-3.5 w-3.5",
          atRisk || waitingOnYou ? "text-amber-500" : "text-orange-500"
        )}
      />
      {compact ? (
        <span>{displayCount || "·"}</span>
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}
