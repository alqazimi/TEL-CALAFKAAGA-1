import type { Profile } from "@/types";
import { ABOUT_YOU_STEP_COUNT, STEPS } from "@/components/questionnaire/steps";

import { CITIZENSHIP_NOT_REQUIRED_COUNTRIES } from "@/lib/constants";

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
  partnerBeard?: string;
  partnerHijabLevel?: string;
}

export interface ProfileSection {
  id: string;
  title: string;
  stepIndex: number;
}

export const PROFILE_SECTIONS: ProfileSection[] = [
  { id: "gender", title: "Gender", stepIndex: 0 },
  { id: "basic", title: "Basic Information", stepIndex: 1 },
  { id: "religious", title: "Your Religious Practice", stepIndex: 2 },
  { id: "education", title: "Education & Work", stepIndex: 3 },
  { id: "marriage", title: "Marriage & Family", stepIndex: 5 },
  { id: "lifestyle", title: "Lifestyle", stepIndex: 6 },
  { id: "about", title: "About You", stepIndex: 7 },
  { id: "preferences", title: "Partner Preferences", stepIndex: 8 },
  { id: "photo", title: "Profile Photo", stepIndex: 9 },
];

export type SectionStatus = "complete" | "in_progress" | "not_started";

export function isMarriageComplete(profile: Profile): boolean {
  return (
    !!profile.maritalStatus &&
    !!profile.wantChildren &&
    !!profile.familyInvolvement &&
    !!profile.polygynyOpenness
  );
}

export function isEducationComplete(profile: Profile): boolean {
  return !!profile.education && !!profile.occupation && !!profile.financialReadiness;
}

export function isBasicComplete(profile: Profile): boolean {
  const needsCitizenship =
    !!profile.country &&
    !CITIZENSHIP_NOT_REQUIRED_COUNTRIES.includes(
      profile.country as (typeof CITIZENSHIP_NOT_REQUIRED_COUNTRIES)[number]
    );
  return (
    profile.age > 0 &&
    !!profile.country &&
    !!profile.city &&
    profile.height > 0 &&
    profile.weight > 0 &&
    (!needsCitizenship || !!profile.citizenshipStatus) &&
    (profile.languagesSpoken?.length ?? 0) > 0
  );
}

export function isReligiousComplete(profile: Profile): boolean {
  const base = !!profile.prayerFrequency;
  if (profile.gender === "female") {
    return base && profile.wearsHijab !== undefined;
  }
  if (profile.gender === "male") {
    return base && profile.hasBeard !== undefined;
  }
  return base;
}

export function isAboutYouComplete(profile: Profile): boolean {
  return (
    !!profile.readyToRelocate &&
    !!profile.livingSituation &&
    !!profile.marriageTimeline &&
    !!profile.loveLanguage &&
    (profile.qualities?.length ?? 0) > 0 &&
    (profile.hobbies?.length ?? 0) > 0
  );
}

export function isLifestyleComplete(profile: Profile): boolean {
  const substanceOk =
    profile.smokes === "No" ||
    (profile.smokes === "Yes" && !!profile.substanceDetails?.trim());
  return substanceOk && !!profile.exercise;
}

export function isPhotoComplete(profile: Profile): boolean {
  return !!profile.profileImageId;
}

export function isPreferencesComplete(
  profile: Profile,
  prefs: Preferences | null | undefined
): boolean {
  if (!prefs) return false;
  const divorceeOk =
    profile.maritalStatus === "Divorced" || !!prefs.acceptDivorcee;
  const widowOk = profile.maritalStatus === "Widowed" || !!prefs.acceptWidow;
  const childrenOk =
    profile.marrySomeoneWithChildren === "No" || !!prefs.acceptChildren;
  const appearanceOk =
    profile.gender === "female"
      ? !!prefs.partnerBeard
      : profile.gender === "male"
        ? !!prefs.partnerHijabLevel
        : true;
  return (
    !!profile.spousePrayerImportance &&
    !!profile.marrySomeoneWithChildren &&
    appearanceOk &&
    prefs.minAge !== undefined &&
    prefs.maxAge !== undefined &&
    prefs.minHeight !== undefined &&
    prefs.maxHeight !== undefined &&
    !!prefs.educationLevel &&
    !!prefs.religiousLevel &&
    childrenOk &&
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
  gender: (p) => p.gender === "male" || p.gender === "female",
  basic: (p) => isBasicComplete(p),
  religious: (p) => isReligiousComplete(p),
  education: (p) => isEducationComplete(p),
  marriage: (p) => isMarriageComplete(p),
  lifestyle: (p) => isLifestyleComplete(p),
  about: (p) => isAboutYouComplete(p),
  preferences: (p, prefs) => isPreferencesComplete(p, prefs),
  photo: (p) => isPhotoComplete(p),
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
    gender: profile.gender === "male" || profile.gender === "female",
    basic:
      profile.age > 0 ||
      !!profile.country ||
      !!profile.city ||
      !!profile.citizenshipStatus ||
      (profile.languagesSpoken?.length ?? 0) > 0,
    religious: !!profile.prayerFrequency,
    education: !!profile.education || !!profile.occupation || !!profile.financialReadiness,
    marriage:
      !!profile.maritalStatus ||
      !!profile.wantChildren ||
      !!profile.familyInvolvement ||
      !!profile.polygynyOpenness,
    lifestyle: profile.smokes === "Yes" || profile.smokes === "No",
    about:
      !!profile.readyToRelocate ||
      !!profile.livingSituation ||
      !!profile.marriageTimeline ||
      !!profile.loveLanguage,
    preferences:
      !!profile.spousePrayerImportance ||
      !!prefs?.educationLevel ||
      !!prefs?.religiousLevel ||
      !!prefs?.partnerBeard ||
      !!prefs?.partnerHijabLevel ||
      (prefs?.preferredCountries?.length ?? 0) > 0,
    photo: !!profile.profileImageId,
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
        return profile.education ? 4 : 3;
      }
      if (section.id === "preferences" && isAboutYouPhaseComplete(profile, prefs)) {
        return ABOUT_YOU_STEP_COUNT;
      }
      if (section.id === "photo" && isPreferencesComplete(profile, prefs)) {
        return STEPS.length - 1;
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
    return "Almost done — upload your photo and submit to unlock matches.";
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
