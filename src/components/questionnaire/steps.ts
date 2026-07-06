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
  CHILDREN_COUNT,
} from "@/lib/constants";

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: "select" | "radio" | "number" | "textarea" | "multi-select" | "range" | "country-search" | "country-multi";
  options?: readonly string[] | number[];
  required?: boolean;
  /** Show only when another field equals this value */
  condition?: { field: string; value: string };
  /** Hide when another field is one of these values */
  hideWhen?: { field: string; values: string[] };
  min?: number;
  max?: number;
  maxSelect?: number;
  preferences?: boolean;
  /** UI-only field, not saved to profile */
  uiOnly?: boolean;
}

export const STEPS: StepConfig[] = [
  {
    id: 1,
    title: "Basic Information",
    description: "Tell us about yourself",
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
    title: "Religion",
    description: "Your religious practices and preferences",
    fields: [
      { name: "religiousLevel", label: "How religious are you?", type: "radio", options: RELIGIOUS_LEVELS, required: true },
      {
        name: "prayerFrequency",
        label: "Do you perform the five daily prayers?",
        type: "radio",
        options: PRAYER_FREQUENCY,
        required: true,
      },
      {
        name: "spousePrayerImportance",
        label: "How important is it that your spouse prays regularly?",
        type: "radio",
        options: SPOUSE_PRAYER_IMPORTANCE,
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
    fields: [
      { name: "education", label: "Education Level", type: "radio", options: EDUCATION_LEVELS, required: true },
    ],
  },
  {
    id: 4,
    title: "Employment",
    description: "Your work situation",
    fields: [
      { name: "occupation", label: "Employment Status", type: "radio", options: OCCUPATIONS, required: true },
    ],
  },
  {
    id: 5,
    title: "Marriage & Family",
    description: "Your marriage history and family",
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
      {
        name: "children",
        label: "How many children do you have?",
        type: "select",
        options: CHILDREN_COUNT,
        condition: { field: "hasChildren", value: "Yes" },
        required: true,
      },
      {
        name: "marrySomeoneWithChildren",
        label: "Would you marry someone with children?",
        type: "radio",
        options: YES_NO_DEPENDS,
        required: true,
      },
    ],
  },
  {
    id: 6,
    title: "Lifestyle",
    description: "Your daily habits",
    fields: [
      { name: "smokes", label: "Do you smoke?", type: "radio", options: FREQUENCY, required: true },
      { name: "drinksAlcohol", label: "Do you drink alcohol?", type: "radio", options: FREQUENCY, required: true },
      { name: "exercise", label: "How often do you exercise?", type: "radio", options: EXERCISE, required: true },
    ],
  },
  {
    id: 7,
    title: "Future Plans",
    description: "Your vision for the future",
    fields: [
      {
        name: "wantChildren",
        label: "Do you want children in the future?",
        type: "radio",
        options: YES_NO_MAYBE,
        required: true,
      },
      { name: "readyToRelocate", label: "Ready to relocate?", type: "radio", options: YES_NO_MAYBE, required: true },
      { name: "marriageTimeline", label: "Marriage Timeline", type: "radio", options: MARRIAGE_TIMELINE, required: true },
      { name: "bio", label: "Tell us about yourself (max 500 characters)", type: "textarea", max: 500 },
      { name: "qualities", label: "Choose up to 10 qualities", type: "multi-select", options: QUALITIES, maxSelect: 10 },
      { name: "hobbies", label: "Choose your hobbies", type: "multi-select", options: HOBBIES },
      { name: "pref_minAge", label: "Preferred Min Age", type: "select", options: AGE_OPTIONS, preferences: true },
      { name: "pref_maxAge", label: "Preferred Max Age", type: "select", options: AGE_OPTIONS, preferences: true },
      { name: "pref_minHeight", label: "Preferred Min Height", type: "select", options: HEIGHT_OPTIONS, preferences: true },
      { name: "pref_maxHeight", label: "Preferred Max Height", type: "select", options: HEIGHT_OPTIONS, preferences: true },
      { name: "pref_preferredCountries", label: "Preferred Countries", type: "country-multi", preferences: true },
      { name: "pref_educationLevel", label: "Preferred Education", type: "radio", options: EDUCATION_LEVELS, preferences: true },
      { name: "pref_religiousLevel", label: "Preferred Religious Level", type: "radio", options: RELIGIOUS_LEVELS, preferences: true },
      {
        name: "pref_acceptDivorcee",
        label: "Accept Divorcee?",
        type: "radio",
        options: YES_NO_DEPENDS,
        preferences: true,
        hideWhen: { field: "maritalStatus", values: ["Divorced"] },
      },
      {
        name: "pref_acceptWidow",
        label: "Accept Widow?",
        type: "radio",
        options: YES_NO_DEPENDS,
        preferences: true,
        hideWhen: { field: "maritalStatus", values: ["Widowed"] },
      },
      { name: "pref_acceptChildren", label: "Accept Children?", type: "radio", options: YES_NO, preferences: true },
      { name: "pref_maxDistance", label: "Maximum Distance", type: "radio", options: MAX_DISTANCE, preferences: true },
    ],
  },
];
