import {
  CITIES,
  AGE_OPTIONS,
  HEIGHT_OPTIONS,
  WEIGHT_OPTIONS,
  RELIGIOUS_LEVELS,
  PRAYER_FREQUENCY,
  SPOUSE_PRAYER_IMPORTANCE,
  EDUCATION_LEVELS,
  OCCUPATIONS,
  MARITAL_STATUS,
  YES_NO,
  YES_NO_DEPENDS,
  YES_NO_MAYBE,
  FREQUENCY,
  EXERCISE,
  MARRIAGE_TIMELINE,
  MAX_DISTANCE,
  QUALITIES,
  HOBBIES,
} from "@/lib/constants";

export type QuestionnairePhase = "about" | "partner";

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  phase: QuestionnairePhase;
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: "select" | "radio" | "number" | "textarea" | "multi-select" | "range" | "country-search" | "country-multi";
  options?: readonly string[] | number[];
  required?: boolean;
  condition?: { field: string; value: string };
  hideWhen?: { field: string; values: string[] };
  min?: number;
  max?: number;
  maxSelect?: number;
  preferences?: boolean;
  uiOnly?: boolean;
}

/** Part 1 — about the user (steps 1–7). */
const ABOUT_YOU_STEPS: StepConfig[] = [
  {
    id: 1,
    title: "Basic Information",
    description: "Tell us about yourself",
    phase: "about",
    fields: [
      { name: "age", label: "Age", type: "select", options: AGE_OPTIONS, required: true },
      { name: "country", label: "Country", type: "country-search", required: true },
      { name: "city", label: "City", type: "select", options: [], required: true },
      { name: "height", label: "Height (cm)", type: "select", options: HEIGHT_OPTIONS, required: true },
      { name: "weight", label: "Weight (kg)", type: "select", options: WEIGHT_OPTIONS, required: true },
    ],
  },
  {
    id: 2,
    title: "Your Religious Practice",
    description: "Your own religious habits",
    phase: "about",
    fields: [
      {
        name: "prayerFrequency",
        label: "Do you perform the five daily prayers?",
        type: "radio",
        options: PRAYER_FREQUENCY,
        required: true,
      },
      {
        name: "wearsHijab",
        label: "Do you wear Hijab?",
        type: "radio",
        options: ["Yes", "No"],
        condition: { field: "gender", value: "female" },
      },
    ],
  },
  {
    id: 3,
    title: "Education",
    description: "Your educational background",
    phase: "about",
    fields: [
      { name: "education", label: "Education Level", type: "radio", options: EDUCATION_LEVELS, required: true },
    ],
  },
  {
    id: 4,
    title: "Employment",
    description: "Your work situation",
    phase: "about",
    fields: [
      { name: "occupation", label: "Employment Status", type: "radio", options: OCCUPATIONS, required: true },
    ],
  },
  {
    id: 5,
    title: "Marriage & Family",
    description: "Your marriage history and family",
    phase: "about",
    fields: [
      {
        name: "maritalStatus",
        label: "Have you ever been married?",
        type: "radio",
        options: MARITAL_STATUS,
        required: true,
      },
      {
        name: "hasChildren",
        label: "Do you have children?",
        type: "radio",
        options: YES_NO,
        required: true,
        uiOnly: true,
      },
    ],
  },
  {
    id: 6,
    title: "Lifestyle",
    description: "Your daily habits",
    phase: "about",
    fields: [
      { name: "smokes", label: "Do you smoke?", type: "radio", options: FREQUENCY, required: true },
      { name: "drinksAlcohol", label: "Do you drink alcohol?", type: "radio", options: FREQUENCY, required: true },
      { name: "exercise", label: "How often do you exercise?", type: "radio", options: EXERCISE, required: true },
    ],
  },
  {
    id: 7,
    title: "About You",
    description: "Your plans, personality, and interests",
    phase: "about",
    fields: [
      { name: "readyToRelocate", label: "Ready to relocate?", type: "radio", options: YES_NO_MAYBE, required: true },
      { name: "marriageTimeline", label: "Marriage Timeline", type: "radio", options: MARRIAGE_TIMELINE, required: true },
      { name: "bio", label: "Tell us about yourself (max 500 characters)", type: "textarea", max: 500 },
      { name: "qualities", label: "Choose up to 10 qualities that describe you", type: "multi-select", options: QUALITIES, maxSelect: 10 },
      { name: "hobbies", label: "Choose your hobbies", type: "multi-select", options: HOBBIES },
    ],
  },
];

/** Part 2 — what the user wants in a partner (after about-you is done). */
const PARTNER_PREFERENCES_STEPS: StepConfig[] = [
  {
    id: 8,
    title: "Partner Preferences",
    description: "What you are looking for in a spouse",
    phase: "partner",
    fields: [
      {
        name: "spousePrayerImportance",
        label: "How important is it that your spouse prays regularly?",
        type: "radio",
        options: SPOUSE_PRAYER_IMPORTANCE,
        required: true,
      },
      {
        name: "marrySomeoneWithChildren",
        label: "Would you marry someone with children?",
        type: "radio",
        options: YES_NO_DEPENDS,
        required: true,
      },
      { name: "pref_minAge", label: "Preferred Min Age", type: "select", options: AGE_OPTIONS, preferences: true, required: true },
      { name: "pref_maxAge", label: "Preferred Max Age", type: "select", options: AGE_OPTIONS, preferences: true, required: true },
      { name: "pref_minHeight", label: "Preferred Min Height", type: "select", options: HEIGHT_OPTIONS, preferences: true, required: true },
      { name: "pref_maxHeight", label: "Preferred Max Height", type: "select", options: HEIGHT_OPTIONS, preferences: true, required: true },
      { name: "pref_preferredCountries", label: "Preferred Countries", type: "country-multi", preferences: true },
      { name: "pref_educationLevel", label: "Preferred Education", type: "radio", options: EDUCATION_LEVELS, preferences: true, required: true },
      { name: "pref_religiousLevel", label: "Preferred Religious Level", type: "radio", options: RELIGIOUS_LEVELS, preferences: true, required: true },
      {
        name: "pref_acceptDivorcee",
        label: "Accept someone who is divorced?",
        type: "radio",
        options: YES_NO_DEPENDS,
        preferences: true,
        hideWhen: { field: "maritalStatus", values: ["Divorced"] },
      },
      {
        name: "pref_acceptWidow",
        label: "Accept someone who is widowed?",
        type: "radio",
        options: YES_NO_DEPENDS,
        preferences: true,
        hideWhen: { field: "maritalStatus", values: ["Widowed"] },
      },
      { name: "pref_acceptChildren", label: "Accept someone with children?", type: "radio", options: YES_NO, preferences: true, required: true },
      { name: "pref_maxDistance", label: "Maximum Distance", type: "radio", options: MAX_DISTANCE, preferences: true, required: true },
    ],
  },
];

export const STEPS: StepConfig[] = [...ABOUT_YOU_STEPS, ...PARTNER_PREFERENCES_STEPS];

export const ABOUT_YOU_STEP_COUNT = ABOUT_YOU_STEPS.length;
export const PARTNER_PREFERENCES_STEP_INDEX = ABOUT_YOU_STEP_COUNT;
