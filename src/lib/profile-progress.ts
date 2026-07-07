import type { Profile } from "@/types";
import { ABOUT_YOU_STEP_COUNT, STEPS } from "@/components/questionnaire/steps";

export interface Preferences {
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  preferredCountries?: string[];
  educationLevel?: string;
  religiousLevel?: string;
  acceptDivorcee?: string;
  acceptWidow?: string;
  acceptChildren?: string;
  maxDistance?: string;
}

export interface ProfileSection {
  id: string;
  title: string;
  stepIndex: number;
}

export const PROFILE_SECTIONS: ProfileSection[] = [
  { id: "basic", title: "Basic Information", stepIndex: 0 },
  { id: "religious", title: "Your Religious Practice", stepIndex: 1 },
  { id: "education", title: "Education & Work", stepIndex: 2 },
  { id: "marriage", title: "Marriage & Family", stepIndex: 4 },
  { id: "lifestyle", title: "Lifestyle", stepIndex: 5 },
  { id: "about", title: "About You", stepIndex: 6 },
  { id: "preferences", title: "Partner Preferences", stepIndex: 7 },
];

export type SectionStatus = "complete" | "in_progress" | "not_started";

export function isBasicComplete(profile: Profile): boolean {
  return (
    profile.age > 0 &&
    !!profile.country &&
    !!profile.city &&
    profile.height > 0 &&
    profile.weight > 0
  );
}

export function isReligiousComplete(profile: Profile): boolean {
  const base = !!profile.prayerFrequency;
  if (profile.gender === "female") {
    return base && profile.wearsHijab !== undefined;
  }
  return base;
}

export function isEducationComplete(profile: Profile): boolean {
  return !!profile.education && !!profile.occupation;
}

export function isMarriageComplete(profile: Profile): boolean {
  return !!profile.maritalStatus;
}

export function isLifestyleComplete(profile: Profile): boolean {
  return !!profile.smokes && !!profile.drinksAlcohol && !!profile.exercise;
}

export function isAboutYouComplete(profile: Profile): boolean {
  return (
    !!profile.readyToRelocate &&
    !!profile.marriageTimeline &&
    !!profile.bio?.trim() &&
    (profile.qualities?.length ?? 0) > 0 &&
    (profile.hobbies?.length ?? 0) > 0
  );
}

export function isPreferencesComplete(
  profile: Profile,
  prefs: Preferences | null | undefined
): boolean {
  if (!prefs) return false;
  const divorceeOk =
    profile.maritalStatus === "Divorced" || !!prefs.acceptDivorcee;
  const widowOk = profile.maritalStatus === "Widowed" || !!prefs.acceptWidow;
  return (
    !!profile.spousePrayerImportance &&
    !!profile.marrySomeoneWithChildren &&
    prefs.minAge !== undefined &&
    prefs.maxAge !== undefined &&
    prefs.minHeight !== undefined &&
    prefs.maxHeight !== undefined &&
    !!prefs.educationLevel &&
    !!prefs.religiousLevel &&
    !!prefs.acceptChildren &&
    !!prefs.maxDistance &&
    (prefs.preferredCountries?.length ?? 0) > 0 &&
    divorceeOk &&
    widowOk
  );
}

export function isAboutYouPhaseComplete(
  profile: Profile,
  prefs?: Preferences | null
): boolean {
  return (
    isBasicComplete(profile) &&
    isReligiousComplete(profile) &&
    isEducationComplete(profile) &&
    isMarriageComplete(profile) &&
    isLifestyleComplete(profile) &&
    isAboutYouComplete(profile)
  );
}

const sectionCheckers: Record<
  string,
  (profile: Profile, prefs?: Preferences | null) => boolean
> = {
  basic: (p) => isBasicComplete(p),
  religious: (p) => isReligiousComplete(p),
  education: (p) => isEducationComplete(p),
  marriage: (p) => isMarriageComplete(p),
  lifestyle: (p) => isLifestyleComplete(p),
  about: (p) => isAboutYouComplete(p),
  preferences: (p, prefs) => isPreferencesComplete(p, prefs),
};

export function getSectionStatus(
  sectionId: string,
  profile: Profile,
  prefs?: Preferences | null
): SectionStatus {
  const checker = sectionCheckers[sectionId];
  if (!checker) return "not_started";
  if (checker(profile, prefs)) return "complete";

  const section = PROFILE_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return "not_started";

  const step = profile.questionnaireStep ?? 1;
  const sectionStep = section.stepIndex + 1;

  const partialChecks: Record<string, boolean> = {
    basic: profile.age > 0 || !!profile.country || !!profile.city,
    religious: !!profile.prayerFrequency,
    education: !!profile.education || !!profile.occupation,
    marriage: !!profile.maritalStatus,
    lifestyle: !!profile.smokes || !!profile.drinksAlcohol,
    about: !!profile.readyToRelocate || !!profile.marriageTimeline || !!profile.bio?.trim(),
    preferences:
      !!profile.spousePrayerImportance ||
      !!prefs?.educationLevel ||
      !!prefs?.religiousLevel ||
      (prefs?.preferredCountries?.length ?? 0) > 0,
  };

  if (partialChecks[sectionId] || step >= sectionStep) return "in_progress";

  return "not_started";
}

export function calculateProfileProgress(
  profile: Profile,
  prefs?: Preferences | null
): number {
  const completed = PROFILE_SECTIONS.filter(
    (s) => getSectionStatus(s.id, profile, prefs) === "complete"
  ).length;
  return Math.round((completed / PROFILE_SECTIONS.length) * 100);
}

export function getRemainingSections(
  profile: Profile,
  prefs?: Preferences | null
): number {
  return PROFILE_SECTIONS.filter(
    (s) => getSectionStatus(s.id, profile, prefs) !== "complete"
  ).length;
}

export function getResumeStepIndex(
  profile: Profile,
  prefs?: Preferences | null
): number {
  if (profile.questionnaireComplete) return 0;

  for (const section of PROFILE_SECTIONS) {
    if (getSectionStatus(section.id, profile, prefs) !== "complete") {
      if (section.id === "education" && isReligiousComplete(profile)) {
        return profile.education ? 3 : 2;
      }
      if (section.id === "preferences" && isAboutYouPhaseComplete(profile, prefs)) {
        return ABOUT_YOU_STEP_COUNT;
      }
      return section.stepIndex;
    }
  }

  return STEPS.length;
}

export function getEncouragementMessage(
  profile: Profile,
  prefs?: Preferences | null
): string {
  const progress = calculateProfileProgress(profile, prefs);
  const remaining = getRemainingSections(profile, prefs);

  if (progress >= 100) {
    return "Your profile is complete. Start exploring your matches!";
  }
  if (!isAboutYouPhaseComplete(profile, prefs)) {
    return "First, tell us about yourself. Partner preferences come next.";
  }
  if (remaining <= 2) {
    return "Almost done — finish your partner preferences to unlock matches.";
  }
  if (progress >= 50) {
    return "The more information you provide, the better your matches will be.";
  }
  return "Complete your profile to receive accurate matches.";
}

export const LOCKED_FEATURES = [
  { label: "Matches", icon: "Heart" },
  { label: "Messages", icon: "MessageCircle" },
  { label: "Who Liked Me", icon: "Eye" },
] as const;
