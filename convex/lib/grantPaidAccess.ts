import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { sendNotification } from "./sendNotification";
import { scheduleSiteMetricsRebuild } from "../siteMetrics";

/** Unlock paid membership after Stripe or approved EVC payment. */
export async function grantPaidAccess(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    isPremium: boolean;
    /** When true, body text mentions upgrade instead of new registration. */
    isUpgrade?: boolean;
    /** Send member payment notification (skip for chat unlocks). */
    notify?: boolean;
  }
): Promise<void> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", args.userId))
    .unique();

  if (!profile) return;

  await ctx.db.patch(profile._id, {
    hasPaid: true,
    genderLocked: true,
    ...(args.isPremium ? { hasPersonalSupport: true } : {}),
    ...(args.isPremium || profile.gender === "male"
      ? {
          approved: true,
          reviewStatus: "approved" as const,
        }
      : {
          approved: false,
          reviewStatus: "pending_review" as const,
        }),
  });

  await scheduleSiteMetricsRebuild(ctx);

  if (profile.questionnaireComplete) {
    await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
      userId: args.userId,
    });
  }

  if (args.notify === false) return;

  await sendNotification(ctx, {
    userId: args.userId,
    type: "payment",
    title: "Payment successful",
    body: args.isPremium
      ? args.isUpgrade
        ? "Your premium plan is active. WhatsApp support and match-search help are ready."
        : "Your registration and personal support plan are active. Browse matches from your dashboard."
      : profile.gender === "female"
        ? "Payment received. An admin will review your profile shortly — you will be notified when matches unlock."
        : "Your registration is complete. Browse matches from your dashboard.",
    sendEmail: true,
  });
}
