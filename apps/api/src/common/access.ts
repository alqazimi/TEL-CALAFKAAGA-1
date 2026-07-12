/** Port of convex/lib/roles.ts + src/lib/access.ts — exact paid/staff rules. */

export type UserRole = "user" | "admin" | "owner";

export function isStaffRole(role?: string | null): role is "admin" | "owner" {
  return role === "admin" || role === "owner";
}

export function isOwnerRole(role?: string | null): role is "owner" {
  return role === "owner";
}

/**
 * Trial fields are legacy and do NOT grant access.
 * hasPaid or staff determines paid access.
 */
export function hasPaidAccess(
  profile:
    | {
        hasPaid?: boolean | null;
        role?: string | null;
        trialEndsAt?: Date | number | null;
        isInTrial?: boolean;
      }
    | null
    | undefined
): boolean {
  if (!profile) return false;
  return !!profile.hasPaid || isStaffRole(profile.role);
}

/** Premium = hasPersonalSupport or legacy paidCents >= 2000. */
export function isPremiumMember(
  profile:
    | {
        hasPersonalSupport?: boolean | null;
        paidCents?: number | null;
      }
    | null
    | undefined
): boolean {
  if (!profile) return false;
  if (profile.hasPersonalSupport === true) return true;
  if ((profile.paidCents ?? 0) >= 2000) return true;
  return false;
}

export const STAFF_PROFILE_COMPLETION_PATCH = {
  questionnaireComplete: true as const,
  registrationComplete: true as const,
  questionnaireStep: 11,
  approved: true as const,
  verified: false as const,
  reviewStatus: "approved" as const,
  hasPaid: true as const,
};
