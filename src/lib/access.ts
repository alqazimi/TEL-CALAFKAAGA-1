export type UserRole = "user" | "admin" | "owner";

export function isStaffRole(role?: string): role is "admin" | "owner" {
  return role === "admin" || role === "owner";
}

export function isOwnerRole(role?: string): role is "owner" {
  return role === "owner";
}

export function hasPaidAccess(
  profile:
    | {
        hasPaid?: boolean;
        role?: string;
        trialEndsAt?: number;
        isInTrial?: boolean;
        gender?: string;
      }
    | null
    | undefined
): boolean {
  if (!profile) return false;
  // Women: Basic is free (full app access). Premium remains optional.
  // Men: must pay — no free trial.
  if (profile.gender === "female") return true;
  return !!profile.hasPaid || isStaffRole(profile.role);
}

/** Premium = WhatsApp personal support + staff search help (not extra app locks). */
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
  if (profile.hasPersonalSupport === true) return true;
  // Legacy Premium was $20 — do not treat old $10 Basic payments as Premium.
  if ((profile.paidCents ?? 0) >= 2000) return true;
  return false;
}
