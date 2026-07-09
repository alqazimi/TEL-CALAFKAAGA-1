import { isInTrialPeriod } from "./trial";

export type UserRole = "user" | "admin" | "owner";

export function isStaffRole(role?: string): role is "admin" | "owner" {
  return role === "admin" || role === "owner";
}

export function isOwnerRole(role?: string): role is "owner" {
  return role === "owner";
}

export function hasPaidAccess(
  profile:
    | { hasPaid?: boolean; role?: string; trialEndsAt?: number; isInTrial?: boolean }
    | null
    | undefined
): boolean {
  if (!profile) return false;
  return !!profile.hasPaid || isStaffRole(profile.role) || isInTrialPeriod(profile);
}

export function isPremiumMember(
  profile:
    | {
        hasPersonalSupport?: boolean;
        trialEndsAt?: number;
        hasPaid?: boolean;
        isInTrial?: boolean;
        paidCents?: number;
      }
    | null
    | undefined
): boolean {
  if (!profile) return false;
  if (isInTrialPeriod(profile)) return true;
  if (profile.hasPersonalSupport === true) return true;
  if ((profile.paidCents ?? 0) >= 2000) return true;
  return false;
}
