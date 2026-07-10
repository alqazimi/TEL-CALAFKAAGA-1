import { isValidContactName, isValidContactPhone } from "./phone";

type ProfileLike = {
  name?: string;
  phone?: string;
  age?: number;
  height?: number;
  weight?: number;
  country?: string;
  city?: string;
  languagesSpoken?: string[];
  prayerFrequency?: string;
  wearsHijab?: boolean;
  gender?: string;
  education?: string;
  occupation?: string;
  financialReadiness?: string;
  marriageWorkPreference?: string;
  maritalStatus?: string;
  wantChildren?: string;
  polygynyOpenness?: string;
  hasCurrentWife?: string;
  openToSecondWife?: string;
  acceptPreviouslyMarriedMan?: string;
  acceptFutureCoWife?: string;
  smokes?: string;
  substanceDetails?: string;
  exercise?: string;
  marriageTimeline?: string;
  loveLanguage?: string;
  qualities?: string[];
  hobbies?: string[];
  spousePrayerImportance?: string;
  marrySomeoneWithChildren?: string;
  profileImageId?: string;
  questionnaireComplete?: boolean;
};

type PrefsLike = {
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  preferredCountries?: string[];
  educationLevel?: string;
  acceptChildren?: string;
  partnerHijabLevel?: string;
} | null;

function hasText(value: string | undefined): boolean {
  return !!value?.trim();
}

function isBasicComplete(profile: ProfileLike): boolean {
  return (
    (profile.age ?? 0) > 0 &&
    hasText(profile.country) &&
    hasText(profile.city) &&
    (profile.height ?? 0) > 0 &&
    (profile.weight ?? 0) > 0 &&
    (profile.languagesSpoken?.length ?? 0) > 0
  );
}

function isReligiousComplete(profile: ProfileLike): boolean {
  if (!hasText(profile.prayerFrequency)) return false;
  if (profile.gender === "female") {
    return profile.wearsHijab !== undefined;
  }
  return true;
}

function isEducationComplete(profile: ProfileLike): boolean {
  const employmentOk =
    profile.gender === "female"
      ? hasText(profile.marriageWorkPreference) || hasText(profile.financialReadiness)
      : hasText(profile.financialReadiness);
  return hasText(profile.education) && hasText(profile.occupation) && employmentOk;
}

function isMarriageComplete(profile: ProfileLike): boolean {
  const polygynyOk =
    profile.gender === "male"
      ? (!!profile.hasCurrentWife && !!profile.openToSecondWife) ||
        hasText(profile.polygynyOpenness)
      : (!!profile.acceptPreviouslyMarriedMan && !!profile.acceptFutureCoWife) ||
        hasText(profile.polygynyOpenness);
  return (
    hasText(profile.maritalStatus) &&
    hasText(profile.wantChildren) &&
    polygynyOk
  );
}

function isLifestyleComplete(profile: ProfileLike): boolean {
  const substanceOk =
    profile.smokes === "No" ||
    (profile.smokes === "Yes" && hasText(profile.substanceDetails));
  return substanceOk && hasText(profile.exercise);
}

function isAboutYouComplete(profile: ProfileLike): boolean {
  return (
    hasText(profile.marriageTimeline) &&
    hasText(profile.loveLanguage) &&
    (profile.qualities?.length ?? 0) > 0 &&
    (profile.hobbies?.length ?? 0) > 0
  );
}

function isContactComplete(profile: ProfileLike): boolean {
  return (
    isValidContactName(profile.name ?? "") &&
    isValidContactPhone(profile.phone ?? "")
  );
}

function isPhotoComplete(profile: ProfileLike): boolean {
  return !!profile.profileImageId;
}

function isPreferencesComplete(profile: ProfileLike, prefs: PrefsLike): boolean {
  if (!prefs) return false;
  const childrenOk =
    profile.marrySomeoneWithChildren === "No" || !!prefs.acceptChildren;
  const appearanceOk =
    profile.gender === "male" ? !!prefs.partnerHijabLevel : true;
  return (
    hasText(profile.spousePrayerImportance) &&
    hasText(profile.marrySomeoneWithChildren) &&
    appearanceOk &&
    prefs.minAge !== undefined &&
    prefs.maxAge !== undefined &&
    prefs.minHeight !== undefined &&
    prefs.maxHeight !== undefined &&
    !!prefs.educationLevel &&
    childrenOk &&
    (prefs.preferredCountries?.length ?? 0) > 0
  );
}

/** Why a member profile is not ready for live access / admin approval. */
export function getProfileIncompleteReason(
  profile: ProfileLike,
  prefs?: PrefsLike
): string | null {
  if (!isBasicComplete(profile)) {
    return "Profile is incomplete: basic information is missing.";
  }
  if (!isReligiousComplete(profile)) {
    return "Profile is incomplete: religious practice answers are missing.";
  }
  if (!isEducationComplete(profile)) {
    return "Profile is incomplete: education and work answers are missing.";
  }
  if (!isMarriageComplete(profile)) {
    return "Profile is incomplete: marriage and family answers are missing.";
  }
  if (!isLifestyleComplete(profile)) {
    return "Profile is incomplete: lifestyle answers are missing.";
  }
  if (!isAboutYouComplete(profile)) {
    return "Profile is incomplete: about-you answers are missing.";
  }
  if (!isPreferencesComplete(profile, prefs ?? null)) {
    return "Profile is incomplete: partner preferences are missing.";
  }
  if (!isContactComplete(profile)) {
    return "Profile is incomplete: full name and valid phone number are required.";
  }
  if (!isPhotoComplete(profile)) {
    return "Profile is incomplete: a profile photo is required.";
  }
  return null;
}

export function isProfileFullyComplete(
  profile: ProfileLike,
  prefs?: PrefsLike
): boolean {
  return getProfileIncompleteReason(profile, prefs) === null;
}

export function assertProfileFullyComplete(
  profile: ProfileLike,
  prefs?: PrefsLike
): void {
  const reason = getProfileIncompleteReason(profile, prefs);
  if (reason) throw new Error(reason);
}
