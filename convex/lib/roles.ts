export const USER_ROLES = ["user", "admin", "owner"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isStaffRole(role: string | undefined): role is "admin" | "owner" {
  return role === "admin" || role === "owner";
}

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
