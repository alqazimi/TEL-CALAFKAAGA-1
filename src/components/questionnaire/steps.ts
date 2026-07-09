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
  LIVING_ARRANGEMENT_MALE,
  LIVING_ARRANGEMENT_FEMALE,
  BEARD_PREFERENCE,
  HIJAB_LEVEL_PREFERENCE,
  POLYGYNY_OPENNESS,
  LANGUAGES_SPOKEN,
  CITIZENSHIP_STATUS,
  CITIZENSHIP_NOT_REQUIRED_COUNTRIES,
  FINANCIAL_READINESS,
  MARRIAGE_WORK_PREFERENCE,
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
    | "gender-select"
    | "text";
  options?: readonly string[] | number[];
  required?: boolean;
  condition?: { field: string; value: string };
  /** Show only when the dependency field matches one of these values. */
  showWhen?: { field: string; values: string[] };
  hideWhen?: { field: string; values: string[] };
  min?: number;
  max?: number;
  maxSelect?: number;
  preferences?: boolean;
  uiOnly?: boolean;
  /** Override i18n key for FIELD_LABELS (defaults to `name`). */
  labelKey?: string;
}

/** Part 1 — about the user (steps 1–7). Gender is collected during registration. */
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
        condition: { field: "gender", value: "male" },
        required: true,
      },
      {
        name: "marriageWorkPreference",
        label: "After marriage, what is your preference?",
        type: "radio",
        options: MARRIAGE_WORK_PREFERENCE,
        condition: { field: "gender", value: "female" },
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
        label: "What is your marital status?",
        type: "radio",
        options: MARITAL_STATUS,
        required: true,
      },
      {
        name: "hasChildren",
        label: "Do you have children from a previous marriage?",
        type: "radio",
        options: YES_NO,
        required: true,
        uiOnly: true,
        showWhen: { field: "maritalStatus", values: ["Divorced", "Widowed"] },
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
        name: "hasCurrentWife",
        label: "Do you currently have a wife?",
        type: "radio",
        options: YES_NO,
        condition: { field: "gender", value: "male" },
        required: true,
      },
      {
        name: "openToSecondWife",
        label: "Do you plan to marry another wife in the future?",
        type: "radio",
        options: POLYGYNY_OPENNESS,
        condition: { field: "gender", value: "male" },
        required: true,
      },
      {
        name: "acceptManWithWife",
        label: "Would you marry a man who already has a wife?",
        type: "radio",
        options: POLYGYNY_OPENNESS,
        condition: { field: "gender", value: "female" },
        required: true,
      },
      {
        name: "acceptFutureCoWife",
        label: "Would you accept if your husband marries another wife later?",
        type: "radio",
        options: POLYGYNY_OPENNESS,
        condition: { field: "gender", value: "female" },
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
        labelKey: "livingSituation_male",
        label: "After marriage, where do you plan for your wife to live?",
        type: "radio",
        options: LIVING_ARRANGEMENT_MALE,
        condition: { field: "gender", value: "male" },
        required: true,
      },
      {
        name: "livingSituation",
        labelKey: "livingSituation_female",
        label: "After marriage, where would you prefer to live?",
        type: "radio",
        options: LIVING_ARRANGEMENT_FEMALE,
        condition: { field: "gender", value: "female" },
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
        showWhen: { field: "maritalStatus", values: ["Never married", "Widowed"] },
        required: true,
      },
      {
        name: "pref_acceptWidow",
        label: "Accept someone who is widowed?",
        type: "radio",
        options: YES_NO_DEPENDS,
        preferences: true,
        showWhen: { field: "maritalStatus", values: ["Never married", "Divorced"] },
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

const CONTACT_STEP: StepConfig = {
  id: 9,
  title: "Your contact details",
  description: "Your name and phone number",
  phase: "about",
  fields: [
    { name: "name", label: "Full name", type: "text", required: true },
    { name: "phone", label: "Phone number", type: "text", required: true },
  ],
};

const PROFILE_PHOTO_STEP: StepConfig = {
  id: 10,
  title: "Profile Photo",
  description: "Upload a clear photo — matches will see this on your profile",
  phase: "photo",
  fields: [],
};

export const STEPS: StepConfig[] = [
  ...ABOUT_YOU_STEPS,
  ...PARTNER_PREFERENCES_STEPS,
  CONTACT_STEP,
  PROFILE_PHOTO_STEP,
];

export const ABOUT_YOU_STEP_COUNT = ABOUT_YOU_STEPS.length;
export const PARTNER_PREFERENCES_STEP_INDEX = ABOUT_YOU_STEP_COUNT;
export const CONTACT_STEP_INDEX = PARTNER_PREFERENCES_STEP_INDEX + 1;
export const PHOTO_STEP_INDEX = STEPS.length - 1;
