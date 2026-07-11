import {
  PERSONAL_SUPPORT_AMOUNT_CENTS,
  PREMIUM_UPGRADE_AMOUNT_CENTS,
} from "../payments";

export const MAX_PROFILE_PHOTOS = 5;
export const MAX_ADDITIONAL_PHOTOS = MAX_PROFILE_PHOTOS - 1;

export { PREMIUM_UPGRADE_AMOUNT_CENTS };

/** Premium = personal WhatsApp support + staff match search (not app feature locks). */
export function isPremiumMember(
  profile: { hasPersonalSupport?: boolean; hasPaid?: boolean } | null | undefined,
  paidCents?: number
): boolean {
  if (!profile) return false;
  if (profile.hasPersonalSupport === true) return true;
  // Legacy / new Premium registration was $20 (2000¢). Upgrades are $15 via hasPersonalSupport.
  if (paidCents !== undefined && paidCents >= PERSONAL_SUPPORT_AMOUNT_CENTS) {
    return true;
  }
  return false;
}

export function isBasicPaidMember(
  profile: {
    hasPaid: boolean;
    hasPersonalSupport?: boolean;
    gender?: string;
  } | null | undefined,
  paidCents?: number
): boolean {
  if (!profile) return false;
  if (isPremiumMember(profile, paidCents)) return false;
  return profile.hasPaid === true;
}
