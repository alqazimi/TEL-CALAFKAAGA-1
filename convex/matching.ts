import { effectiveReligiousLevel } from "./lib/profileEnrichment";

const RELIGIOUS_SCORES: Record<string, number> = {
  "Very Practicing": 4,
  Practicing: 3,
  Moderate: 2,
  "Less Practicing": 1,
};

const PRAYER_SCORES: Record<string, number> = {
  Always: 4,
  "Most of the time": 3,
  Sometimes: 2,
  Rarely: 1,
};

const EDUCATION_SCORES: Record<string, number> = {
  "High School": 1,
  Diploma: 2,
  Bachelor: 3,
  Master: 4,
  PhD: 5,
  Other: 2,
};

const TIMELINE_SCORES: Record<string, number> = {
  Immediately: 4,
  "Within 6 months": 3,
  "Within 1 year": 2,
  "No timeline": 1,
};

function spousePrayerScore(
  importance: string | undefined,
  candidatePrayer: string | undefined
): number {
  const prayer = PRAYER_SCORES[candidatePrayer ?? ""] ?? 0;
  if (!importance || importance === "No preference") return 5;
  if (importance === "Very important") {
    return prayer >= 3 ? 5 : prayer >= 2 ? 3 : 0;
  }
  if (importance === "Preferred") {
    return prayer >= 2 ? 5 : prayer >= 1 ? 3 : 0;
  }
  return 3;
}

function distanceScore(
  user: Profile,
  userPrefs: Preferences,
  candidate: Profile
): number {
  const maxDistance = userPrefs.maxDistance;
  if (!maxDistance || maxDistance === "Worldwide") return 5;

  const sameCountry =
    user.country && candidate.country && user.country === candidate.country;
  const sameCity =
    sameCountry &&
    user.city &&
    candidate.city &&
    user.city.toLowerCase() === candidate.city.toLowerCase();

  if (maxDistance === "Same City") {
    return sameCity ? 5 : sameCountry ? 2 : 0;
  }
  if (maxDistance === "Same Country") {
    return sameCountry ? 5 : 0;
  }
  return 3;
}

function relocateScore(user: Profile, candidate: Profile): number {
  const userReady = user.readyToRelocate;
  const candReady = candidate.readyToRelocate;
  if (!userReady || !candReady) return 2;
  if (userReady === "Yes" && (candReady === "Yes" || candReady === "Maybe")) return 3;
  if (userReady === "Maybe" && candReady !== "No") return 3;
  if (userReady === "No" && candReady === "No") return 3;
  return 1;
}

export function calculateCompatibility(
  user: Profile,
  userPrefs: Preferences,
  candidate: Profile,
  _candidatePrefs: Preferences
): number {
  let score = 0;

  // Religion alignment — 25 points
  const userRel = RELIGIOUS_SCORES[effectiveReligiousLevel(user)] ?? 2;
  const candRel = RELIGIOUS_SCORES[effectiveReligiousLevel(candidate)] ?? 2;
  const relDiff = Math.abs(userRel - candRel);
  score += Math.max(0, 25 - relDiff * 8);

  // Preferred religious level — 5 points
  const prefRel = RELIGIOUS_SCORES[userPrefs.religiousLevel] ?? 2;
  const prefDiff = Math.abs(prefRel - candRel);
  score += Math.max(0, 5 - prefDiff * 2);

  // Spouse prayer importance — 5 points
  score += spousePrayerScore(user.spousePrayerImportance, candidate.prayerFrequency);

  // Age — 15 points
  if (candidate.age >= userPrefs.minAge && candidate.age <= userPrefs.maxAge) {
    score += 15;
  } else {
    const diff = Math.min(
      Math.abs(candidate.age - userPrefs.minAge),
      Math.abs(candidate.age - userPrefs.maxAge)
    );
    score += Math.max(0, 15 - diff * 3);
  }

  // Country preference — 8 points
  if (
    userPrefs.preferredCountries.length === 0 ||
    userPrefs.preferredCountries.includes(candidate.country)
  ) {
    score += 8;
  } else if (user.country === candidate.country) {
    score += 4;
  }

  // Distance preference — 5 points
  score += distanceScore(user, userPrefs, candidate);

  // Height — 5 points
  if (candidate.height >= userPrefs.minHeight && candidate.height <= userPrefs.maxHeight) {
    score += 5;
  } else {
    const diff = Math.min(
      Math.abs(candidate.height - userPrefs.minHeight),
      Math.abs(candidate.height - userPrefs.maxHeight)
    );
    score += Math.max(0, 5 - diff);
  }

  // Education — 8 points
  const userEdu = EDUCATION_SCORES[userPrefs.educationLevel] ?? 2;
  const candEdu = EDUCATION_SCORES[candidate.education] ?? 2;
  const eduDiff = Math.abs(userEdu - candEdu);
  score += Math.max(0, 8 - eduDiff * 2);

  // Children — 8 points
  if (user.marrySomeoneWithChildren === "No") {
    if (candidate.children === 0) score += 8;
  } else if (userPrefs.acceptChildren === "Yes") {
    score += 8;
  } else if (userPrefs.acceptChildren === "Depends" && candidate.children === 0) {
    score += 8;
  } else if (userPrefs.acceptChildren === "No" && candidate.children === 0) {
    score += 8;
  }

  // Marriage status — 5 points
  if (candidate.maritalStatus === "Never married" || candidate.maritalStatus === "Never Married") {
    score += 5;
  } else if (candidate.maritalStatus === "Divorced" && userPrefs.acceptDivorcee === "Yes") {
    score += 5;
  } else if (candidate.maritalStatus === "Widowed" && userPrefs.acceptWidow === "Yes") {
    score += 5;
  }

  // Qualities — 8 points
  const sharedQualities = user.qualities.filter((q) => candidate.qualities.includes(q));
  const qualityScore = Math.min(
    8,
    (sharedQualities.length / Math.max(user.qualities.length, 1)) * 8
  );
  score += qualityScore;

  // Hobbies — 4 points
  const sharedHobbies = user.hobbies.filter((h) => candidate.hobbies.includes(h));
  const hobbyScore = Math.min(
    4,
    (sharedHobbies.length / Math.max(user.hobbies.length, 1)) * 4
  );
  score += hobbyScore;

  // Marriage timeline — 7 points
  const userTimeline = TIMELINE_SCORES[user.marriageTimeline] ?? 2;
  const candTimeline = TIMELINE_SCORES[candidate.marriageTimeline] ?? 2;
  const timelineDiff = Math.abs(userTimeline - candTimeline);
  score += Math.max(0, 7 - timelineDiff * 2);

  // Relocation compatibility — 3 points
  score += relocateScore(user, candidate);

  // Want children alignment — 4 points
  score += wantChildrenScore(user.wantChildren, candidate.wantChildren);

  // Family involvement — 2 points
  if (user.familyInvolvement && candidate.familyInvolvement) {
    score += user.familyInvolvement === candidate.familyInvolvement ? 2 : 1;
  }

  // Living situation — 2 points
  if (user.livingSituation && candidate.livingSituation) {
    score += user.livingSituation === candidate.livingSituation ? 2 : 1;
  }

  // Languages overlap — 2 points
  if (user.languagesSpoken?.length && candidate.languagesSpoken?.length) {
    const sharedLang = user.languagesSpoken.filter((l) =>
      candidate.languagesSpoken!.includes(l)
    );
    score += Math.min(2, sharedLang.length);
  }

  // Partner appearance preference — 3 points
  score += appearancePrefScore(user, userPrefs, candidate);

  // Polygyny alignment — 2 points
  score += polygynyScore(user.polygynyOpenness, candidate.polygynyOpenness);

  return Math.round(Math.min(100, Math.max(0, score)));
}

function wantChildrenScore(userWant?: string, candWant?: string): number {
  if (!userWant || !candWant) return 2;
  if (userWant === candWant) return 4;
  if (userWant === "Maybe" || candWant === "Maybe") return 3;
  if (
    (userWant === "Yes" || userWant === "Already have and open to more") &&
    (candWant === "Yes" || candWant === "Already have and open to more")
  ) {
    return 4;
  }
  if (userWant === "No" && candWant === "No") return 4;
  if (userWant === "No" || candWant === "No") return 0;
  return 2;
}

function appearancePrefScore(
  user: Profile,
  prefs: Preferences,
  candidate: Profile
): number {
  if (user.gender === "female") {
    const pref = prefs.partnerBeard;
    if (!pref || pref === "No preference") return 3;
    // Soft points — we don't store whether men have a beard yet.
    return pref === "Beard required" ? 2 : 3;
  }
  if (user.gender === "male") {
    const pref = prefs.partnerHijabLevel;
    if (!pref || pref === "No preference") return 3;
    if (candidate.wearsHijab === true) return 3;
    if (candidate.wearsHijab === false) return pref === "No preference" ? 3 : 1;
    return 2;
  }
  return 2;
}

function polygynyScore(userVal?: string, candVal?: string): number {
  if (!userVal || !candVal) return 1;
  if (userVal === candVal) return 2;
  if (userVal === "Maybe" || candVal === "Maybe") return 1;
  return 0;
}

export interface Profile {
  religiousLevel: string;
  prayerFrequency?: string;
  spousePrayerImportance?: string;
  readyToRelocate?: string;
  age: number;
  country: string;
  city?: string;
  height: number;
  education: string;
  maritalStatus: string;
  children: number;
  qualities: string[];
  hobbies: string[];
  marriageTimeline: string;
  marrySomeoneWithChildren?: string;
  gender: "male" | "female";
  wantChildren?: string;
  familyInvolvement?: string;
  livingSituation?: string;
  polygynyOpenness?: string;
  languagesSpoken?: string[];
  citizenshipStatus?: string;
  financialReadiness?: string;
  wearsHijab?: boolean;
  smokes?: string;
}

export interface Preferences {
  minAge: number;
  maxAge: number;
  minHeight: number;
  maxHeight: number;
  preferredCountries: string[];
  acceptChildren: string;
  educationLevel: string;
  religiousLevel: string;
  acceptDivorcee: string;
  acceptWidow: string;
  maxDistance: string;
  preferredGender: "male" | "female";
  qualities: string[];
  hobbies: string[];
  partnerBeard?: string;
  partnerHijabLevel?: string;
}

export { effectiveReligiousLevel };
