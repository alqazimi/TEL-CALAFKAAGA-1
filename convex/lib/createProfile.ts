import { GenericId } from "convex/values";
import { internal } from "../_generated/api";
import { MutationCtx } from "../_generated/server";
import { PROFILE_DEFAULTS } from "./questionnaire";
import {
  QUESTIONNAIRE_COMPLETE_STEP,
  religiousLevelFromPrayer,
} from "./profileEnrichment";
import { isStaffRole } from "./roles";

type ProfileArgs = {
  name: string;
  gender: "male" | "female";
  phone?: string;
};

const SIGNUP_INCOMPLETE_REMINDER_MS = 30 * 60 * 1000;

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
    marriageTimeline: "",
    loveLanguage: "",
    marrySomeoneWithChildren: "",
    qualities: [],
    hobbies: [],
    questionnaireComplete: false,
    questionnaireStep: 0,
    lastSavedAt: undefined,
    registrationComplete: false,
    hasPaid: false,
    banned: false,
    approved: false,
    reviewStatus: "incomplete",
    photoVisibility: "everyone",
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
    acceptDivorcee: "Depends",
    acceptWidow: "Depends",
    qualities: [],
    hobbies: [],
    partnerBeard: "",
    partnerHijabLevel: "",
  });

  // If they never finish the questionnaire, nudge by email after 30 minutes.
  await ctx.scheduler.runAfter(
    SIGNUP_INCOMPLETE_REMINDER_MS,
    internal.memberEmailReminders.sendSignupIncompleteReminder,
    { userId }
  );

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
    // Never treat CONTACT_COMPLETE_STEP (10) as "legacy complete" — that is the
    // live contact-step marker and resets users mid-questionnaire.
    if (existing.questionnaireStep === undefined) {
      backfill.questionnaireStep = existing.questionnaireComplete
        ? QUESTIONNAIRE_COMPLETE_STEP
        : PROFILE_DEFAULTS.questionnaireStep;
    } else if (
      existing.questionnaireComplete &&
      existing.questionnaireStep < QUESTIONNAIRE_COMPLETE_STEP
    ) {
      backfill.questionnaireStep = QUESTIONNAIRE_COMPLETE_STEP;
    }
    if (!existing.religiousLevel?.trim() && existing.prayerFrequency?.trim()) {
      backfill.religiousLevel = religiousLevelFromPrayer(existing.prayerFrequency);
    }

    // Never auto-clear questionnaireComplete / approved here — that marked
    // finished members incomplete on every save. Approval gates stay in admin.

    if (isStaffRole(existing.role)) {
      if (!existing.questionnaireComplete) {
        backfill.questionnaireComplete = true;
        backfill.questionnaireStep = QUESTIONNAIRE_COMPLETE_STEP;
      }
      if (existing.registrationComplete !== true) {
        backfill.registrationComplete = true;
      }
      if (!existing.approved) backfill.approved = true;
      if (!existing.verified) backfill.verified = false;
      if (existing.reviewStatus !== "approved") backfill.reviewStatus = "approved";
      if (!existing.hasPaid) backfill.hasPaid = true;
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
