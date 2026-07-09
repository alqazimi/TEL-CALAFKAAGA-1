import { enrichProfileUpdates } from "./profileEnrichment";
import { isValidContactName, isValidContactPhone } from "./phone";

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
  "name",
  "phone",
  "smokes",
  "substanceDetails",
  "exercise",
  "wantChildren",
  "familyInvolvement",
  "livingSituation",
  "polygynyOpenness",
  "hasCurrentWife",
  "openToSecondWife",
  "acceptManWithWife",
  "acceptPreviouslyMarriedMan",
  "acceptFutureCoWife",
  "languagesSpoken",
  "citizenshipStatus",
  "financialReadiness",
  "marriageWorkPreference",
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

/** 1-based step numbers (match frontend `currentStep + 1`). */
export const CONTACT_IN_PROGRESS_STEP = 8;
export const CONTACT_COMPLETE_STEP = 9;

export function hasValidContact(
  profile: { name?: string; phone?: string },
  updates: Record<string, unknown> = {}
): boolean {
  const name =
    typeof updates.name === "string"
      ? updates.name
      : profile.name ?? "";
  const phone =
    typeof updates.phone === "string"
      ? updates.phone
      : profile.phone ?? "";
  return isValidContactName(name) && isValidContactPhone(phone);
}

/** Drop invalid or placeholder contact fields so autosave cannot wipe profile data. */
export function sanitizeContactProfileUpdates(
  updates: Record<string, unknown>
): void {
  if (typeof updates.name === "string") {
    const name = updates.name.trim();
    if (!isValidContactName(name)) {
      delete updates.name;
    } else {
      updates.name = name;
    }
  }
  if (typeof updates.phone === "string") {
    const phone = updates.phone.trim();
    if (!isValidContactPhone(phone)) {
      delete updates.phone;
    } else {
      updates.phone = phone;
    }
  }
}
