/** Total questionnaire form steps (matches STEPS.length in the frontend). */
export const QUESTIONNAIRE_COMPLETE_STEP = 9;

/** Map prayer frequency answers to religious level for matching & filters. */
export function religiousLevelFromPrayer(prayerFrequency: string): string {
  switch (prayerFrequency) {
    case "Always":
      return "Very Practicing";
    case "Most of the time":
      return "Practicing";
    case "Sometimes":
      return "Moderate";
    case "Rarely":
      return "Less Practicing";
    default:
      return "";
  }
}

export function effectiveReligiousLevel(profile: {
  religiousLevel?: string;
  prayerFrequency?: string;
}): string {
  if (profile.religiousLevel?.trim()) return profile.religiousLevel;
  if (profile.prayerFrequency?.trim()) {
    return religiousLevelFromPrayer(profile.prayerFrequency);
  }
  return "";
}

/** Derive `religiousLevel` from `prayerFrequency` when saving questionnaire data. */
export function enrichProfileUpdates(
  updates: Record<string, unknown>
): Record<string, unknown> {
  const enriched = { ...updates };
  if (typeof enriched.prayerFrequency === "string" && enriched.prayerFrequency) {
    enriched.religiousLevel = religiousLevelFromPrayer(enriched.prayerFrequency);
  }
  return enriched;
}
