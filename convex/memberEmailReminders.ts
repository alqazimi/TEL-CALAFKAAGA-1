import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import { hasPaidAccess, isStaffRole } from "./lib/roles";
import { getTrialDaysRemaining, isInTrialPeriod } from "./lib/trial";

const REMINDER_COOLDOWN_MS = 72 * 60 * 60 * 1000;
const MIN_AGE_MS = 24 * 60 * 60 * 1000;

type ReminderKind =
  | "reminder_profile"
  | "reminder_payment"
  | "reminder_trial_ending"
  | "reminder_signup_incomplete"
  | "request_profile_photo";

async function wasReminderSentRecently(
  ctx: MutationCtx,
  userId: Id<"users">,
  kind: ReminderKind
) {
  const logs = await ctx.db
    .query("memberEmailLog")
    .withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", kind))
    .order("desc")
    .take(1);

  const latest = logs[0];
  if (!latest) return false;
  return Date.now() - latest.sentAt < REMINDER_COOLDOWN_MS;
}

async function logReminderSent(
  ctx: MutationCtx,
  userId: Id<"users">,
  kind: ReminderKind
) {
  await ctx.db.insert("memberEmailLog", {
    userId,
    kind,
    sentAt: Date.now(),
  });
}

async function queueReminderEmail(
  ctx: MutationCtx,
  userId: Id<"users">,
  kind: ReminderKind,
  subject: string,
  body: string,
  ctaLabel: string,
  ctaPath: string
) {
  const user = await ctx.db.get(userId);
  const email = user?.email?.trim();
  if (!email) return;

  await ctx.scheduler.runAfter(0, internal.memberEmails.send, {
    email,
    subject,
    body,
    ctaLabel,
    ctaPath,
  });
  await logReminderSent(ctx, userId, kind);
}

/** Fired 30 minutes after signup if the questionnaire is still incomplete. */
export const sendSignupIncompleteReminder = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile || profile.banned || isStaffRole(profile.role)) return;
    if (profile.questionnaireComplete) return;

    const alreadySent = await ctx.db
      .query("memberEmailLog")
      .withIndex("by_user_kind", (q) =>
        q.eq("userId", args.userId).eq("kind", "reminder_signup_incomplete")
      )
      .take(1);
    if (alreadySent.length > 0) return;

    await queueReminderEmail(
      ctx,
      args.userId,
      "reminder_signup_incomplete",
      "Dhammaystir akoonkaaga Hel Calafkaaga",
      "Waxaad sameysatay akoon, laakiin weli ma dhammaystirin profile-kaaga. Fadlan dhamee su'aalaha iyo sawirkaaga si aad u hesho isbarbardhigyo. / You created an account but have not finished your profile. Please complete the questionnaire and photo.",
      "Dhammaystir profile-ka",
      "/questionnaire"
    );
  },
});

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    const now = Date.now();

    for (const profile of profiles) {
      if (isStaffRole(profile.role) || profile.banned) continue;

      if (!profile.questionnaireComplete) {
        if (now - profile._creationTime < MIN_AGE_MS) continue;
        if (await wasReminderSentRecently(ctx, profile.userId, "reminder_profile")) {
          continue;
        }

        await queueReminderEmail(
          ctx,
          profile.userId,
          "reminder_profile",
          "Complete your Hel Calafkaaga profile",
          "You started your account but have not finished your profile yet. Complete your questionnaire and photo so we can suggest compatible matches.",
          "Continue profile",
          "/questionnaire"
        );
        continue;
      }

      if (isInTrialPeriod(profile) && !profile.hasPaid) {
        const daysLeft = getTrialDaysRemaining(profile, now);
        if (daysLeft > 2) continue;
        if (await wasReminderSentRecently(ctx, profile.userId, "reminder_trial_ending")) {
          continue;
        }

        await queueReminderEmail(
          ctx,
          profile.userId,
          "reminder_trial_ending",
          "Your free week on Hel Calafkaaga is ending soon",
          daysLeft <= 0
            ? "Your 7-day free trial has ended. Choose the $10 or $20 plan to keep browsing matches and messaging."
            : `You have ${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free premium trial. After that, choose the $10 or $20 plan to continue.`,
          "View plans",
          daysLeft <= 0 ? "/payment" : "/matches"
        );
        continue;
      }

      if (!hasPaidAccess(profile)) {
        const referenceTime = profile.trialEndsAt ?? profile.lastSavedAt ?? profile._creationTime;
        if (now - referenceTime < MIN_AGE_MS) continue;
        if (await wasReminderSentRecently(ctx, profile.userId, "reminder_payment")) {
          continue;
        }

        await queueReminderEmail(
          ctx,
          profile.userId,
          "reminder_payment",
          "Unlock matches on Hel Calafkaaga",
          "Your free week has ended. Choose the $10 or $20 plan to keep browsing serious members and connecting with compatible matches.",
          "Choose plan",
          "/payment"
        );
      }
    }
  },
});
