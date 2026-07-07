import type { FieldConfig, StepConfig } from "@/components/questionnaire/steps";
import type { Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";

function formatHeightWeight(value: number, plus: string): string {
  if (value >= parseInt(plus)) return plus;
  return String(value);
}

export function initFormState(
  profile: Profile | null | undefined,
  preferences: Preferences | null | undefined
) {
  if (!profile) {
    return { selects: {}, radios: {}, multiSelects: {}, bio: "", selectedCountry: "" };
  }

  const selects: Record<string, string> = {};
  const radios: Record<string, string> = {};
  const multiSelects: Record<string, string[]> = {};

  if (profile.age > 0) selects.age = String(profile.age);
  if (profile.country) selects.country = profile.country;
  if (profile.city) selects.city = profile.city;
  if (profile.height > 0) selects.height = formatHeightWeight(profile.height, "200+");
  if (profile.weight > 0) selects.weight = formatHeightWeight(profile.weight, "100+");

  if (profile.religiousLevel) radios.religiousLevel = profile.religiousLevel;
  if (profile.prayerFrequency) radios.prayerFrequency = profile.prayerFrequency;
  if (profile.spousePrayerImportance) radios.spousePrayerImportance = profile.spousePrayerImportance;
  if (profile.wearsHijab !== undefined) radios.wearsHijab = profile.wearsHijab ? "Yes" : "No";

  if (profile.education) radios.education = profile.education;
  if (profile.occupation) radios.occupation = profile.occupation;

  if (profile.maritalStatus) radios.maritalStatus = profile.maritalStatus;
  // Only pre-select "has children" when the user has actually answered the
  // marriage step (marital status set) or has children on record. A brand-new
  // profile defaults children to 0, so we must NOT auto-tick "No".
  if (profile.children > 0) {
    radios.hasChildren = "Yes";
  } else if (profile.maritalStatus) {
    radios.hasChildren = "No";
  }
  if (profile.marrySomeoneWithChildren) {
    radios.marrySomeoneWithChildren = profile.marrySomeoneWithChildren;
  }

  if (profile.smokes) radios.smokes = profile.smokes;
  if (profile.exercise) radios.exercise = profile.exercise;

  if (profile.readyToRelocate) radios.readyToRelocate = profile.readyToRelocate;
  if (profile.marriageTimeline) radios.marriageTimeline = profile.marriageTimeline;

  if (preferences) {
    if (preferences.minAge) selects.pref_minAge = String(preferences.minAge);
    if (preferences.maxAge) selects.pref_maxAge = String(preferences.maxAge);
    if (preferences.minHeight) selects.pref_minHeight = String(preferences.minHeight);
    if (preferences.maxHeight) selects.pref_maxHeight = String(preferences.maxHeight);
    if (preferences.educationLevel) radios.pref_educationLevel = preferences.educationLevel;
    if (preferences.religiousLevel) radios.pref_religiousLevel = preferences.religiousLevel;
    if (preferences.acceptDivorcee) radios.pref_acceptDivorcee = preferences.acceptDivorcee;
    if (preferences.acceptWidow) radios.pref_acceptWidow = preferences.acceptWidow;
    if (preferences.acceptChildren) radios.pref_acceptChildren = preferences.acceptChildren;
    if (preferences.maxDistance) radios.pref_maxDistance = preferences.maxDistance;
    if (preferences.preferredCountries?.length) {
      multiSelects.pref_preferredCountries = preferences.preferredCountries;
    }
  }

  multiSelects.qualities = profile.qualities ?? [];
  multiSelects.hobbies = profile.hobbies ?? [];

  return {
    selects,
    radios,
    multiSelects,
    bio: profile.bio ?? "",
    selectedCountry: profile.country ?? "",
  };
}

export function getFieldValue(
  fieldName: string,
  profile: { gender?: string; maritalStatus?: string; children?: number } | null | undefined,
  radios: Record<string, string>
): string | undefined {
  if (fieldName === "gender") return profile?.gender;
  if (radios[fieldName]) return radios[fieldName];
  if (fieldName === "maritalStatus") return profile?.maritalStatus;
  if (fieldName === "hasChildren" && profile?.children !== undefined) {
    return profile.children > 0 ? "Yes" : "No";
  }
  return undefined;
}

export function isFieldVisible(
  field: FieldConfig,
  profile: { gender?: string; maritalStatus?: string; children?: number } | null | undefined,
  radios: Record<string, string>
): boolean {
  if (field.condition) {
    const condValue = getFieldValue(field.condition.field, profile, radios);
    if (condValue !== field.condition.value) return false;
  }
  if (field.hideWhen) {
    const value = getFieldValue(field.hideWhen.field, profile, radios);
    if (value && field.hideWhen.values.includes(value)) return false;
  }
  return true;
}

export function buildStepData(
  step: StepConfig,
  profile: { gender?: string; maritalStatus?: string; children?: number } | null | undefined,
  state: {
    radios: Record<string, string>;
    selects: Record<string, string>;
    multiSelects: Record<string, string[]>;
    bio: string;
  }
): Record<string, unknown> {
  const { radios, selects, multiSelects, bio } = state;
  const data: Record<string, unknown> = {};
  const preferences: Record<string, unknown> = {};

  for (const field of step.fields) {
    if (!isFieldVisible(field, profile, radios)) continue;
    if (field.uiOnly) continue;

    if (field.type === "textarea") {
      data[field.name] = bio;
    } else if (field.type === "multi-select" || field.type === "country-multi") {
      const values = multiSelects[field.name] ?? [];
      if (field.preferences) {
        preferences[field.name.replace("pref_", "")] = values;
      } else {
        data[field.name] = values;
      }
    } else if (field.type === "country-search") {
      const value = selects[field.name];
      if (field.preferences) {
        preferences[field.name.replace("pref_", "")] = value;
      } else {
        data[field.name] = value;
      }
    } else if (field.type === "select" || field.type === "number") {
      const value = selects[field.name];
      if (field.preferences) {
        const key = field.name.replace("pref_", "");
        preferences[key] = field.name.includes("Age") || field.name.includes("Height")
          ? parseInt(value) || 0
          : value;
      } else if (field.name === "age" || field.name === "height" || field.name === "weight") {
        data[field.name] =
          value === "200+" || value === "100+"
            ? parseInt(value) || 200
            : parseInt(value) || 0;
      } else if (field.name === "wearsHijab") {
        data[field.name] = value === "Yes";
      } else {
        data[field.name] = value;
      }
    } else if (field.type === "radio") {
      const value = radios[field.name];
      if (field.preferences) {
        preferences[field.name.replace("pref_", "")] = value;
      } else {
        data[field.name] = value;
      }
    }
  }

  if (step.fields.some((f) => f.name === "hasChildren")) {
    const hasChildren = radios.hasChildren ?? getFieldValue("hasChildren", profile, radios);
    data.children = hasChildren === "Yes" ? 1 : 0;
  }

  if (Object.keys(preferences).length > 0) {
    data.preferences = preferences;
  }

  return data;
}

export function validateStepFields(
  step: StepConfig,
  profile: { gender?: string; maritalStatus?: string; children?: number } | null | undefined,
  state: {
    radios: Record<string, string>;
    selects: Record<string, string>;
    multiSelects: Record<string, string[]>;
    bio: string;
  }
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of step.fields) {
    if (!isFieldVisible(field, profile, state.radios)) continue;
    if (!field.required) continue;

    if (field.type === "textarea") {
      if (!state.bio.trim()) {
        errors[field.name] = "This field is required";
      }
      continue;
    }

    if (field.type === "multi-select" || field.type === "country-multi") {
      const values = state.multiSelects[field.name] ?? [];
      if (values.length === 0) {
        errors[field.name] = "Please select at least one option";
      }
      continue;
    }

    if (field.type === "radio") {
      if (!state.radios[field.name]) {
        errors[field.name] = "Please select an option";
      }
      continue;
    }

    if (field.type === "country-search" || field.type === "select") {
      if (!state.selects[field.name]?.trim()) {
        errors[field.name] = "This field is required";
      }
    }
  }

  return errors;
}
