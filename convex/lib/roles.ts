import { QUESTIONNAIRE_COMPLETE_STEP } from "./profileEnrichment";

export const USER_ROLES = ["user", "admin", "owner"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isStaffRole(role: string | undefined): role is "admin" | "owner" {
  return role === "admin" || role === "owner";
}

/** Staff accounts skip member onboarding; keep profile flags in sync. */
export const STAFF_PROFILE_COMPLETION_PATCH = {
  questionnaireComplete: true as const,
  registrationComplete: true as const,
  questionnaireStep: QUESTIONNAIRE_COMPLETE_STEP,
  approved: true as const,
  verified: true as const,
  hasPaid: true as const,
};

export function isOwnerRole(role: string | undefined): role is "owner" {
  return role === "owner";
}

import { isInTrialPeriod } from "./trial";

export function hasPaidAccess(profile: {
  hasPaid: boolean;
  role: string;
  trialEndsAt?: number;
}): boolean {
  return (
    profile.hasPaid || isStaffRole(profile.role) || isInTrialPeriod(profile)
  );
}
