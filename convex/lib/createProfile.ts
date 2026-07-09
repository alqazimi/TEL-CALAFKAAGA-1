import { GenericId } from "convex/values";
import { MutationCtx } from "../_generated/server";
import { PROFILE_DEFAULTS } from "./questionnaire";
import {
  QUESTIONNAIRE_COMPLETE_STEP,
  religiousLevelFromPrayer,
} from "./profileEnrichment";
import { getTrialEndsAt } from "./trial";

type ProfileArgs = {
  name: string;
  gender: "male" | "female";
  phone?: string;
};

export async function createUserProfile(
  ctx: MutationCtx,
  userId: GenericId<"users">,
  args: ProfileArgs
) {
  const profileId = await ctx.db.insert("profiles", {
    userId,
    name: args.name,
    gender: args.gender,
    phone: args.phone,
    age: 0,
    height: 170,
    weight: 70,
    country: "",
    city: "",
    education: "",
    occupation: "",
    religiousLevel: "",
    maritalStatus: "",
    children: 0,
    bio: "",
    verified: false,
    role: "user",
    prayerFrequency: "",
    spousePrayerImportance: "",
    smokes: "",
    substanceDetails: "",
    drinksAlcohol: "",
    exercise: "",
    wantChildren: "",
    familyInvolvement: "",
    livingSituation: "",
    polygynyOpenness: "",
    hasCurrentWife: "",
    openToSecondWife: "",
    acceptManWithWife: "",
    acceptPreviouslyMarriedMan: "",
    acceptFutureCoWife: "",
    languagesSpoken: [],
    citizenshipStatus: "",
    financialReadiness: "",
    marriageWorkPreference: "",
    readyToRelocate: "",
    marriageTimeline: "",
    loveLanguage: "",
    marrySomeoneWithChildren: "",
    qualities: [],
    hobbies: [],
    questionnaireComplete: false,
    questionnaireStep: 1,
    lastSavedAt: undefined,
    registrationComplete: false,
    hasPaid: false,
    banned: false,
    approved: false,
  });

  await ctx.db.insert("preferences", {
    userId,
    preferredGender: args.gender === "male" ? "female" : "male",
    minAge: 18,
    maxAge: 60,
    minHeight: 150,
    maxHeight: 210,
    preferredCountries: [],
    acceptChildren: "",
    educationLevel: "Bachelor",
    religiousLevel: "Practicing",
    acceptDivorcee: "Depends",
    acceptWidow: "Depends",
    maxDistance: "Worldwide",
    qualities: [],
    hobbies: [],
    readyToRelocate: "Maybe",
    partnerBeard: "",
    partnerHijabLevel: "",
  });

  return profileId;
}

export async function ensureUserProfile(
  ctx: MutationCtx,
  userId: GenericId<"users">
) {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (existing) {
    const backfill: Record<string, unknown> = {};
    if (existing.spousePrayerImportance === undefined) {
      backfill.spousePrayerImportance = PROFILE_DEFAULTS.spousePrayerImportance;
    }
    if (existing.registrationComplete === undefined) {
      backfill.registrationComplete = true;
    }
    if (existing.questionnaireStep === undefined || existing.questionnaireStep === 10) {
      backfill.questionnaireStep = existing.questionnaireComplete
        ? QUESTIONNAIRE_COMPLETE_STEP
        : PROFILE_DEFAULTS.questionnaireStep;
    }
    if (!existing.religiousLevel?.trim() && existing.prayerFrequency?.trim()) {
      backfill.religiousLevel = religiousLevelFromPrayer(existing.prayerFrequency);
    }
    if (
      existing.questionnaireComplete &&
      !existing.hasPaid &&
      existing.trialEndsAt === undefined
    ) {
      backfill.trialEndsAt = getTrialEndsAt();
    }
    if (Object.keys(backfill).length > 0) {
      await ctx.db.patch(existing._id, backfill);
      return { ...existing, ...backfill };
    }
    return existing;
  }

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");

  const profileId = await createUserProfile(ctx, userId, {
    name: user.name ?? "User",
    gender: user.gender ?? "male",
    phone: user.phone,
  });

  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Failed to create profile");
  return profile;
}
