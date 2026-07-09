"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationPath } from "@/lib/i18n/translations";

const COMPAT_LABEL_KEYS: Record<string, TranslationPath> = {
  religion: "premium.compatReligion",
  prayer: "premium.compatPrayer",
  age: "premium.compatAge",
  country: "premium.compatCountry",
  height: "premium.compatHeight",
  education: "premium.compatEducation",
  children: "premium.compatChildren",
  maritalStatus: "premium.compatMaritalStatus",
  qualities: "premium.compatQualities",
  hobbies: "premium.compatHobbies",
  timeline: "premium.compatTimeline",
  relocation: "premium.compatRelocation",
  wantChildren: "premium.compatWantChildren",
  familyInvolvement: "premium.compatFamilyInvolvement",
  livingSituation: "premium.compatLivingSituation",
  languages: "premium.compatLanguages",
  appearance: "premium.compatAppearance",
  polygyny: "premium.compatPolygyny",
};

interface CompatibilityBreakdownProps {
  targetUserId: Id<"users">;
  isPremium: boolean;
}

export function CompatibilityBreakdown({
  targetUserId,
  isPremium,
}: CompatibilityBreakdownProps) {
  const { t } = useTranslation();
  const breakdown = useQuery(
    api.matches.getCompatibilityBreakdown,
    isPremium ? { targetUserId } : "skip"
  );

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-semibold">{t("premium.compatibilityLockedTitle")}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {t("premium.compatibilityLockedDesc")}
        </p>
      </div>
    );
  }

  if (breakdown === undefined) {
    return <div className="h-24 rounded-2xl bg-muted/50 animate-pulse" />;
  }

  if (!breakdown) return null;

  return (
    <div className="rounded-2xl bg-muted/50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("premium.compatibilityBreakdown")}
      </p>
      <div className="space-y-2.5">
        {breakdown.categories.map((item) => {
          const labelKey = COMPAT_LABEL_KEYS[item.key];
          if (!labelKey) return null;
          const pct = Math.round((item.score / item.maxScore) * 100);
          return (
            <div key={item.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{t(labelKey)}</span>
                <span className="text-muted-foreground">
                  {Math.round(item.score)}/{item.maxScore}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
