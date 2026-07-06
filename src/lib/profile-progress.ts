import type { Profile } from "@/types";

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
  { id: "religious", title: "Religious Practice", stepIndex: 1 },
  { id: "education", title: "Education & Work", stepIndex: 2 },
  { id: "marriage", title: "Marriage Information", stepIndex: 4 },
  { id: "preferences", title: "Partner Preferences", stepIndex: 6 },
  { id: "about", title: "About You", stepIndex: 6 },
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
  const base =
    !!profile.religiousLevel &&
    !!profile.prayerFrequency &&
    !!profile.spousePrayerImportance;
  if (profile.gender === "female") {
    return base && profile.wearsHijab !== undefined;
  }
  return base;
}

export function isEducationComplete(profile: Profile): boolean {
  return !!profile.education && !!profile.occupation;
}

export function isMarriageComplete(profile: Profile): boolean {
  return (
    !!profile.maritalStatus &&
    !!profile.smokes &&
    !!profile.drinksAlcohol &&
    !!profile.exercise &&
    !!profile.marrySomeoneWithChildren
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
    prefs.minAge !== undefined &&
    prefs.maxAge !== undefined &&
    prefs.minHeight !== undefined &&
    prefs.maxHeight !== undefined &&
    !!prefs.educationLevel &&
    !!prefs.religiousLevel &&
    !!prefs.acceptChildren &&
    !!prefs.maxDistance &&
    divorceeOk &&
    widowOk
  );
}

export function isAboutComplete(profile: Profile): boolean {
  return (
    !!profile.wantChildren &&
    !!profile.readyToRelocate &&
    !!profile.marriageTimeline
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
  preferences: (p, prefs) => isPreferencesComplete(p, prefs),
  about: (p) => isAboutComplete(p),
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
    religious: !!profile.religiousLevel || !!profile.prayerFrequency,
    education: !!profile.education || !!profile.occupation,
    marriage: !!profile.maritalStatus || !!profile.smokes,
    preferences: !!prefs?.educationLevel || !!prefs?.religiousLevel,
    about: !!profile.wantChildren || !!profile.readyToRelocate,
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

export function getResumeStepIndex(profile: Profile, prefs?: Preferences | null): number {
  if (profile.questionnaireComplete) return 0;

  for (const section of PROFILE_SECTIONS) {
    if (getSectionStatus(section.id, profile, prefs) !== "complete") {
      if (section.id === "education" && isReligiousComplete(profile)) {
        return profile.education ? 3 : 2;
      }
      return section.stepIndex;
    }
  }

  return 7;
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
  if (remaining <= 2) {
    return "You're only 2 minutes away from unlocking your matches.";
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
