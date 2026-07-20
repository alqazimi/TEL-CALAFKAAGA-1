import { isStaffRole } from "./access";

export type ReviewStatus =
  | "incomplete"
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended";

type ReviewProfile = {
  reviewStatus?: ReviewStatus | string;
  questionnaireComplete?: boolean;
  approved?: boolean;
  banned?: boolean;
  role?: string;
  gender?: string;
  hasPersonalSupport?: boolean;
  hasPaid?: boolean;
};

/**
 * Paid women on Basic need admin profile approval.
 * Men are never admin-approved — they become approved only after payment.
 * Premium women skip the review queue.
 */
export function requiresAdminProfileApproval(
  profile:
    | Pick<ReviewProfile, "role" | "gender" | "hasPersonalSupport" | "hasPaid">
    | null
    | undefined
): boolean {
  if (!profile || isStaffRole(profile.role)) return false;
  if (profile.hasPaid !== true) return false;
  return profile.gender === "female" && profile.hasPersonalSupport !== true;
}

export function resolveReviewStatus(profile: ReviewProfile | null | undefined): ReviewStatus {
  if (!profile) return "incomplete";
  if (profile.banned) return "suspended";
  if (isStaffRole(profile.role)) return "approved";

  // Honor explicit admin approval before payment / completeness heuristics.
  if (profile.reviewStatus === "approved" || profile.approved === true) {
    return "approved";
  }

  if (
    profile.reviewStatus === "rejected" ||
    profile.reviewStatus === "suspended"
  ) {
    return profile.reviewStatus;
  }

  // Unpaid members stay incomplete until payment (unless admin approved above).
  if (profile.questionnaireComplete && profile.hasPaid !== true) {
    return "incomplete";
  }

  // Men awaiting payment show incomplete until paid (unless admin approved above).
  if (
    profile.gender === "male" &&
    profile.questionnaireComplete &&
    !profile.approved
  ) {
    return "incomplete";
  }

  // Stale create-time "incomplete" after the member finished the form (and paid).
  if (profile.reviewStatus === "incomplete" && profile.questionnaireComplete) {
    return profile.approved ? "approved" : "pending_review";
  }

  if (
    profile.reviewStatus === "incomplete" ||
    profile.reviewStatus === "pending_review"
  ) {
    return profile.reviewStatus;
  }

  if (profile.approved && profile.questionnaireComplete) return "approved";
  if (profile.questionnaireComplete) return "pending_review";
  return "incomplete";
}

export function isProfileDiscoverable(profile: ReviewProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.banned) return false;
  if (!profile.questionnaireComplete && !isStaffRole(profile.role)) return false;
  if (profile.hasPaid !== true && !isStaffRole(profile.role)) return false;
  return resolveReviewStatus(profile) === "approved";
}

export function needsApprovalGate(profile: ReviewProfile | null | undefined): boolean {
  if (!profile || !requiresAdminProfileApproval(profile)) return false;
  const status = resolveReviewStatus(profile);
  return status === "pending_review" || status === "rejected";
}
