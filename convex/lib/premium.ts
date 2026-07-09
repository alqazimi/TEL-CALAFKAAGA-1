import {
  PERSONAL_SUPPORT_AMOUNT_CENTS,
  REGISTRATION_AMOUNT_CENTS,
} from "../payments";
import { isInTrialPeriod } from "./trial";

export const MAX_PROFILE_PHOTOS = 5;
export const MAX_ADDITIONAL_PHOTOS = MAX_PROFILE_PHOTOS - 1;

export const PREMIUM_UPGRADE_AMOUNT_CENTS =
  PERSONAL_SUPPORT_AMOUNT_CENTS - REGISTRATION_AMOUNT_CENTS;

export function isPremiumMember(
  profile: { hasPersonalSupport?: boolean; trialEndsAt?: number; hasPaid?: boolean } | null | undefined,
  paidCents?: number
): boolean {
  if (!profile) return false;
  if (isInTrialPeriod(profile)) return true;
  if (profile.hasPersonalSupport === true) return true;
  if (
    paidCents !== undefined &&
    paidCents >= PERSONAL_SUPPORT_AMOUNT_CENTS
  ) {
    return true;
  }
  return false;
}

export function isBasicPaidMember(
  profile: { hasPaid: boolean; hasPersonalSupport?: boolean } | null | undefined,
  paidCents?: number
): boolean {
  if (!profile?.hasPaid) return false;
  return !isPremiumMember(profile, paidCents);
}
