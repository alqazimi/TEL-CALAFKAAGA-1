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
};

export function resolveReviewStatus(profile: ReviewProfile | null | undefined): ReviewStatus {
  if (!profile) return "incomplete";
  if (profile.banned) return "suspended";
  if (isStaffRole(profile.role)) return "approved";
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

export function isProfileDiscoverable(profile: ReviewProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.banned) return false;
  if (!profile.questionnaireComplete && !isStaffRole(profile.role)) return false;
  return resolveReviewStatus(profile) === "approved";
}

export function needsApprovalGate(profile: ReviewProfile | null | undefined): boolean {
  if (!profile || isStaffRole(profile.role)) return false;
  const status = resolveReviewStatus(profile);
  return status === "pending_review" || status === "rejected";
}
