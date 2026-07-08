"use client";

import { BadgeCheck, ClipboardCheck, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export interface TrustBadgeProfile {
  verified?: boolean;
  approved?: boolean;
  hasPaid?: boolean;
  questionnaireComplete?: boolean;
}

interface TrustBadgesProps {
  profile: TrustBadgeProfile;
  size?: "sm" | "md";
  className?: string;
}

export function TrustBadges({ profile, size = "md", className }: TrustBadgesProps) {
  const { t } = useTranslation();
  const compact = size === "sm";
  const isVerified = profile.verified ?? profile.approved;

  const badges = [
    isVerified
      ? {
          key: "verified",
          label: t("trustBadges.verified"),
          icon: BadgeCheck,
          className:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
        }
      : null,
    profile.hasPaid
      ? {
          key: "paid",
          label: t("trustBadges.paidMember"),
          icon: CreditCard,
          className:
            "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200/60 dark:border-sky-900/40",
        }
      : null,
    profile.questionnaireComplete
      ? {
          key: "complete",
          label: t("trustBadges.profileComplete"),
          icon: ClipboardCheck,
          className:
            "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-200/60 dark:border-violet-900/40",
        }
      : null,
  ].filter((badge): badge is NonNullable<typeof badge> => badge !== null);

  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((badge) => (
        <Badge
          key={badge.key}
          variant="outline"
          className={cn(
            "font-semibold border",
            compact ? "text-[10px] px-2 py-0.5" : "text-xs",
            badge.className
          )}
        >
          <badge.icon className={cn("mr-1", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
