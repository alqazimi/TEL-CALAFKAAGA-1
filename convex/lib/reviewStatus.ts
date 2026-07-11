import { isStaffRole } from "./roles";

export const REVIEW_STATUSES = [
  "incomplete",
  "pending_review",
  "approved",
  "rejected",
  "suspended",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

type ReviewProfile = {
  reviewStatus?: ReviewStatus | string;
  questionnaireComplete?: boolean;
  approved?: boolean;
  banned?: boolean;
  role?: string;
  gender?: string;
  hasPersonalSupport?: boolean;
};

/**
 * Only women on free Basic need admin profile approval.
 * Men (any plan) and Premium women skip the approval gate.
 */
export function requiresAdminProfileApproval(
  profile: Pick<ReviewProfile, "role" | "gender" | "hasPersonalSupport"> | null | undefined
): boolean {
  if (!profile || isStaffRole(profile.role)) return false;
  return profile.gender === "female" && profile.hasPersonalSupport !== true;
}

/**
 * Resolve independent review state.
 * Legacy profiles without `reviewStatus` fall back to approved/questionnaire flags.
 * `verified` is intentionally ignored — it must not imply trust.
 */
export function resolveReviewStatus(profile: ReviewProfile): ReviewStatus {
  if (profile.banned) return "suspended";
  if (isStaffRole(profile.role)) return "approved";

  // Stale create-time "incomplete" after the member finished the form.
  if (profile.reviewStatus === "incomplete" && profile.questionnaireComplete) {
    return profile.approved ? "approved" : "pending_review";
  }

  if (
    profile.reviewStatus === "incomplete" ||
    profile.reviewStatus === "pending_review" ||
    profile.reviewStatus === "approved" ||
    profile.reviewStatus === "rejected" ||
    profile.reviewStatus === "suspended"
  ) {
    return profile.reviewStatus;
  }

  if (profile.approved && profile.questionnaireComplete) return "approved";
  if (profile.questionnaireComplete) return "pending_review";
  return "incomplete";
}

/** Eligible to appear in discover / receive likes. */
export function isDiscoverable(profile: ReviewProfile): boolean {
  if (profile.banned) return false;
  if (!profile.questionnaireComplete && !isStaffRole(profile.role)) return false;
  return resolveReviewStatus(profile) === "approved";
}

/** Women Basic waiting for admin review (or rejected). Others are not gated. */
export function needsApprovalGate(profile: ReviewProfile): boolean {
  if (!requiresAdminProfileApproval(profile)) return false;
  const status = resolveReviewStatus(profile);
  return status === "pending_review" || status === "rejected";
}
