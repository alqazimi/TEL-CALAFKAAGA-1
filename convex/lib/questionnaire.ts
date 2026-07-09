import { enrichProfileUpdates } from "./profileEnrichment";

/** Profile fields that may be written by the questionnaire. */
const PROFILE_FIELD_KEYS = new Set([
  "age",
  "height",
  "weight",
  "country",
  "city",
  "education",
  "occupation",
  "religiousLevel",
  "maritalStatus",
  "children",
  "prayerFrequency",
  "spousePrayerImportance",
  "wearsHijab",
  "hasBeard",
  "gender",
  "smokes",
  "substanceDetails",
  "exercise",
  "wantChildren",
  "familyInvolvement",
  "livingSituation",
  "polygynyOpenness",
  "languagesSpoken",
  "citizenshipStatus",
  "financialReadiness",
  "readyToRelocate",
  "marriageTimeline",
  "loveLanguage",
  "marrySomeoneWithChildren",
  "qualities",
  "hobbies",
]);

export function splitQuestionnaireData(data: Record<string, unknown>) {
  const preferences =
    data.preferences && typeof data.preferences === "object" && !Array.isArray(data.preferences)
      ? (data.preferences as Record<string, unknown>)
      : undefined;

  const profileUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "preferences") continue;
    if (PROFILE_FIELD_KEYS.has(key)) {
      profileUpdates[key] = value;
    }
  }

  return {
    profileUpdates: enrichProfileUpdates(profileUpdates),
    preferences,
  };
}

export const PROFILE_DEFAULTS = {
  spousePrayerImportance: "",
  questionnaireStep: 1,
} as const;
