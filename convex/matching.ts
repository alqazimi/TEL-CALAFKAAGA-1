const RELIGIOUS_SCORES: Record<string, number> = {
  "Very Practicing": 4,
  Practicing: 3,
  Moderate: 2,
  "Less Practicing": 1,
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

export function calculateCompatibility(
  user: Profile,
  userPrefs: Preferences,
  candidate: Profile,
  candidatePrefs: Preferences
): number {
  let score = 0;

  // Religion - 30 points
  const userRel = RELIGIOUS_SCORES[user.religiousLevel] ?? 2;
  const candRel = RELIGIOUS_SCORES[candidate.religiousLevel] ?? 2;
  const relDiff = Math.abs(userRel - candRel);
  score += Math.max(0, 30 - relDiff * 10);

  // Age - 15 points
  if (candidate.age >= userPrefs.minAge && candidate.age <= userPrefs.maxAge) {
    score += 15;
  } else {
    const diff = Math.min(
      Math.abs(candidate.age - userPrefs.minAge),
      Math.abs(candidate.age - userPrefs.maxAge)
    );
    score += Math.max(0, 15 - diff * 3);
  }

  // Country - 10 points
  if (userPrefs.preferredCountries.length === 0 ||
      userPrefs.preferredCountries.includes(candidate.country)) {
    score += 10;
  } else if (user.country === candidate.country) {
    score += 5;
  }

  // Height - 5 points
  if (candidate.height >= userPrefs.minHeight && candidate.height <= userPrefs.maxHeight) {
    score += 5;
  } else {
    const diff = Math.min(
      Math.abs(candidate.height - userPrefs.minHeight),
      Math.abs(candidate.height - userPrefs.maxHeight)
    );
    score += Math.max(0, 5 - diff);
  }

  // Education - 10 points
  const userEdu = EDUCATION_SCORES[userPrefs.educationLevel] ?? 2;
  const candEdu = EDUCATION_SCORES[candidate.education] ?? 2;
  const eduDiff = Math.abs(userEdu - candEdu);
  score += Math.max(0, 10 - eduDiff * 2);

  // Children - 10 points
  if (userPrefs.acceptChildren === "Yes") {
    score += 10;
  } else if (userPrefs.acceptChildren === "Depends" && candidate.children === 0) {
    score += 10;
  } else if (userPrefs.acceptChildren === "No" && candidate.children === 0) {
    score += 10;
  }

  // Marriage Status - 5 points
  if (candidate.maritalStatus === "Never married" || candidate.maritalStatus === "Never Married") {
    score += 5;
  } else if (candidate.maritalStatus === "Divorced" && userPrefs.acceptDivorcee === "Yes") {
    score += 5;
  } else if (candidate.maritalStatus === "Widowed" && userPrefs.acceptWidow === "Yes") {
    score += 5;
  }

  // Qualities - 10 points
  const sharedQualities = user.qualities.filter((q) =>
    candidate.qualities.includes(q)
  );
  const qualityScore = Math.min(10, (sharedQualities.length / Math.max(user.qualities.length, 1)) * 10);
  score += qualityScore;

  // Hobbies - 5 points
  const sharedHobbies = user.hobbies.filter((h) =>
    candidate.hobbies.includes(h)
  );
  const hobbyScore = Math.min(5, (sharedHobbies.length / Math.max(user.hobbies.length, 1)) * 5);
  score += hobbyScore;

  // Timeline - 10 points
  const userTimeline = TIMELINE_SCORES[user.marriageTimeline] ?? 2;
  const candTimeline = TIMELINE_SCORES[candidate.marriageTimeline] ?? 2;
  const timelineDiff = Math.abs(userTimeline - candTimeline);
  score += Math.max(0, 10 - timelineDiff * 3);

  return Math.round(Math.min(100, score));
}

export interface Profile {
  religiousLevel: string;
  age: number;
  country: string;
  height: number;
  education: string;
  maritalStatus: string;
  children: number;
  qualities: string[];
  hobbies: string[];
  marriageTimeline: string;
  gender: "male" | "female";
}

export interface Preferences {
  minAge: number;
  maxAge: number;
  minHeight: number;
  maxHeight: number;
  preferredCountries: string[];
  acceptChildren: string;
  educationLevel: string;
  acceptDivorcee: string;
  acceptWidow: string;
  preferredGender: "male" | "female";
  qualities: string[];
  hobbies: string[];
}
