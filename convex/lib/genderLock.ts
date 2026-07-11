import type { Doc } from "../_generated/dataModel";

/** Gender may not change after payment (pricing / approval abuse). */
export function isGenderLocked(
  profile: Pick<Doc<"profiles">, "hasPaid" | "genderLocked">
): boolean {
  return profile.hasPaid === true || profile.genderLocked === true;
}

export function assertGenderMutable(
  profile: Pick<Doc<"profiles">, "hasPaid" | "genderLocked" | "gender">,
  nextGender: "male" | "female"
): void {
  if (nextGender === profile.gender) return;
  if (isGenderLocked(profile)) {
    throw new Error(
      "Gender cannot be changed after payment. Contact support if this was a mistake."
    );
  }
}
