import {
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
  EXERCISE,
  MARRIAGE_TIMELINE,
  LOVE_LANGUAGES,
  WANT_CHILDREN,
  FAMILY_INVOLVEMENT,
  LIVING_SITUATION,
  BEARD_PREFERENCE,
  HIJAB_LEVEL_PREFERENCE,
  POLYGYNY_OPENNESS,
  LANGUAGES_SPOKEN,
  CITIZENSHIP_STATUS,
  CITIZENSHIP_NOT_REQUIRED_COUNTRIES,
  FINANCIAL_READINESS,
  MAX_DISTANCE,
  QUALITIES,
  HOBBIES,
} from "@/lib/constants";

export type QuestionnairePhase = "about" | "partner" | "photo";

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
  type:
    | "select"
    | "radio"
    | "number"
    | "textarea"
    | "multi-select"
    | "range"
    | "country-search"
    | "country-multi"
    | "gender-select";
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

/** Part 1 — about the user (gender + steps 1–7). */
const GENDER_STEP: StepConfig = {
  id: 0,
  title: "About you",
  description: "Who is looking for a spouse?",
  phase: "about",
  fields: [
    {
      name: "gender",
      label: "I am a",
      type: "gender-select",
      required: true,
    },
  ],
};

const ABOUT_YOU_STEPS: StepConfig[] = [
  GENDER_STEP,
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
      {
        name: "citizenshipStatus",
        label: "Citizenship / visa situation",
        type: "radio",
        options: CITIZENSHIP_STATUS,
        required: true,
        hideWhen: {
          field: "country",
          values: [...CITIZENSHIP_NOT_REQUIRED_COUNTRIES],
        },
      },
      {
        name: "languagesSpoken",
        label: "Languages you speak",
        type: "multi-select",
        options: LANGUAGES_SPOKEN,
        required: true,
      },
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
        label: "Do you wear hijab?",
        type: "radio",
        options: YES_NO,
        condition: { field: "gender", value: "female" },
        required: true,
      },
      {
        name: "hasBeard",
        label: "Do you have a beard?",
        type: "radio",
        options: YES_NO,
        condition: { field: "gender", value: "male" },
        required: true,
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
      {
        name: "financialReadiness",
        label: "Financial readiness for marriage",
        type: "radio",
        options: FINANCIAL_READINESS,
        required: true,
      },
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
        hideWhen: { field: "maritalStatus", values: ["Never married"] },
      },
      {
        name: "wantChildren",
        label: "Do you want children?",
        type: "radio",
        options: WANT_CHILDREN,
        required: true,
      },
      {
        name: "familyInvolvement",
        label: "Will family be involved in the process?",
        type: "radio",
        options: FAMILY_INVOLVEMENT,
        required: true,
      },
      {
        name: "polygynyOpenness",
        label: "Are you open to polygyny / a second marriage?",
        type: "radio",
        options: POLYGYNY_OPENNESS,
        required: true,
      },
    ],
  },
  {
    id: 6,
    title: "Lifestyle",
    description: "Your daily habits",
    phase: "about",
    fields: [
      {
        name: "substanceUse",
        label: "Do you use any substances (smoking, drugs, etc.)?",
        type: "radio",
        options: YES_NO,
        required: true,
      },
      {
        name: "substanceDetails",
        label: "Please describe what you use",
        type: "textarea",
        required: true,
        condition: { field: "substanceUse", value: "Yes" },
      },
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
      {
        name: "livingSituation",
        label: "Preferred living situation after marriage?",
        type: "radio",
        options: LIVING_SITUATION,
        required: true,
      },
      { name: "marriageTimeline", label: "Marriage Timeline", type: "radio", options: MARRIAGE_TIMELINE, required: true },
      {
        name: "loveLanguage",
        label: "What is your love language?",
        type: "radio",
        options: LOVE_LANGUAGES,
        required: true,
      },
      { name: "qualities", label: "Choose up to 10 qualities that describe you", type: "multi-select", options: QUALITIES, maxSelect: 10, required: true },
      { name: "hobbies", label: "Choose your hobbies", type: "multi-select", options: HOBBIES, required: true },
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
        name: "pref_partnerBeard",
        label: "Beard preference for your spouse",
        type: "radio",
        options: BEARD_PREFERENCE,
        preferences: true,
        condition: { field: "gender", value: "female" },
        required: true,
      },
      {
        name: "pref_partnerHijabLevel",
        label: "Hijab / niqab preference for your spouse",
        type: "radio",
        options: HIJAB_LEVEL_PREFERENCE,
        preferences: true,
        condition: { field: "gender", value: "male" },
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
      { name: "pref_preferredCountries", label: "Preferred Countries", type: "country-multi", preferences: true, required: true },
      { name: "pref_educationLevel", label: "Preferred Education", type: "radio", options: EDUCATION_LEVELS, preferences: true, required: true },
      { name: "pref_religiousLevel", label: "Preferred Religious Level", type: "radio", options: RELIGIOUS_LEVELS, preferences: true, required: true },
      {
        name: "pref_acceptDivorcee",
        label: "Accept someone who is divorced?",
        type: "radio",
        options: YES_NO_DEPENDS,
        preferences: true,
        hideWhen: { field: "maritalStatus", values: ["Divorced"] },
        required: true,
      },
      {
        name: "pref_acceptWidow",
        label: "Accept someone who is widowed?",
        type: "radio",
        options: YES_NO_DEPENDS,
        preferences: true,
        hideWhen: { field: "maritalStatus", values: ["Widowed"] },
        required: true,
      },
      {
        name: "pref_acceptChildren",
        label: "Accept someone with children?",
        type: "radio",
        options: YES_NO,
        preferences: true,
        hideWhen: { field: "marrySomeoneWithChildren", values: ["No"] },
        required: true,
      },
      { name: "pref_maxDistance", label: "Maximum Distance", type: "radio", options: MAX_DISTANCE, preferences: true, required: true },
    ],
  },
];

const PROFILE_PHOTO_STEP: StepConfig = {
  id: 9,
  title: "Profile Photo",
  description: "Upload a clear photo — matches will see this on your profile",
  phase: "photo",
  fields: [],
};

export const STEPS: StepConfig[] = [
  ...ABOUT_YOU_STEPS,
  ...PARTNER_PREFERENCES_STEPS,
  PROFILE_PHOTO_STEP,
];

export const ABOUT_YOU_STEP_COUNT = ABOUT_YOU_STEPS.length;
export const PARTNER_PREFERENCES_STEP_INDEX = ABOUT_YOU_STEP_COUNT;
export const PHOTO_STEP_INDEX = STEPS.length - 1;
