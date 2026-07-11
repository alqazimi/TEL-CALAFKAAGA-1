import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { sendNotification } from "./lib/sendNotification";

export const REGISTRATION_AMOUNT_CENTS = 500;
/** New-user Premium registration — $20. */
export const PERSONAL_SUPPORT_AMOUNT_CENTS = 2000;
/** Upgrade from Basic to Premium — $15. */
export const PREMIUM_UPGRADE_AMOUNT_CENTS = 1500;

const registrationTierValidator = v.union(
  v.literal("basic"),
  v.literal("premium")
);

const paymentTypeValidator = v.union(
  v.literal("registration"),
  v.literal("registration_premium"),
  v.literal("premium_upgrade"),
  v.literal("chat")
);

async function supersedeOtherPendingPayments(
  ctx: MutationCtx,
  userId: Id<"users">,
  completedPaymentId: Id<"payments">
) {
  const userPayments = await ctx.db
    .query("payments")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  for (const other of userPayments) {
    if (other.status === "pending" && other._id !== completedPaymentId) {
      await ctx.db.patch(other._id, { status: "failed" });
    }
  }
}

async function applyPaymentCompletion(
  ctx: MutationCtx,
  payment: Doc<"payments">,
  matchId?: Id<"matches">
): Promise<{ alreadyCompleted: boolean }> {
  if (payment.status === "completed") {
    return { alreadyCompleted: true };
  }

  await ctx.db.patch(payment._id, { status: "completed" });
  await supersedeOtherPendingPayments(ctx, payment.userId, payment._id);

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", payment.userId))
    .unique();

  if (profile) {
    const isPremium =
      payment.registrationTier === "premium" ||
      payment.paymentType === "registration_premium" ||
      payment.paymentType === "premium_upgrade";

    await ctx.db.patch(profile._id, {
      hasPaid: true,
      ...(isPremium ? { hasPersonalSupport: true } : {}),
      // Paid members (men Basic/Premium, women Premium) skip admin approval.
      approved: true,
      reviewStatus: "approved",
    });

    if (profile.questionnaireComplete) {
      await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
        userId: payment.userId,
      });
    }

    if (
      payment.paymentType === "registration" ||
      payment.paymentType === "registration_premium" ||
      payment.paymentType === "premium_upgrade" ||
      payment.paymentType === undefined
    ) {
      await sendNotification(ctx, {
        userId: payment.userId,
        type: "payment",
        title: "Payment successful",
        body: isPremium
          ? payment.paymentType === "premium_upgrade"
            ? "Your premium plan is active. WhatsApp support and match-search help are ready."
            : "Your registration and personal support plan are active. Browse matches from your dashboard."
          : "Your registration is complete. Browse matches from your dashboard.",
        sendEmail: true,
      });
    }
  }

  if (
    payment.paymentType === "registration" ||
    payment.paymentType === "registration_premium" ||
    payment.paymentType === "premium_upgrade" ||
    payment.paymentType === undefined
  ) {
    const matchesA = await ctx.db
      .query("matches")
      .withIndex("by_userA", (q) => q.eq("userA", payment.userId))
      .collect();
    const matchesB = await ctx.db
      .query("matches")
      .withIndex("by_userB", (q) => q.eq("userB", payment.userId))
      .collect();

    for (const match of [...matchesA, ...matchesB]) {
      if (!match.chatUnlocked) {
        await ctx.db.patch(match._id, { chatUnlocked: true });
      }
    }
  } else if (matchId) {
    await ctx.db.patch(matchId, { chatUnlocked: true });
  }

  return { alreadyCompleted: false };
}

export const getProfileByUserId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

/** Sum of completed registration / premium payments (excludes chat unlock). */
export const getCompletedPlanPaidCents = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return payments
      .filter(
        (p) =>
          p.status === "completed" &&
          (p.paymentType === "registration" ||
            p.paymentType === "registration_premium" ||
            p.paymentType === "premium_upgrade" ||
            p.paymentType === undefined)
      )
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
  },
});

export const recordPendingPayment = internalMutation({
  args: {
    userId: v.id("users"),
    stripeSessionId: v.string(),
    amount: v.number(),
    paymentType: paymentTypeValidator,
    registrationTier: v.optional(registrationTierValidator),
    matchId: v.optional(v.id("matches")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("payments", {
      userId: args.userId,
      stripeSessionId: args.stripeSessionId,
      amount: args.amount,
      paymentType: args.paymentType,
      registrationTier: args.registrationTier,
      matchId: args.matchId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const fulfillCheckoutSession = internalMutation({
  args: {
    stripeSessionId: v.string(),
    userId: v.id("users"),
    amount: v.number(),
    paymentType: paymentTypeValidator,
    registrationTier: v.optional(registrationTierValidator),
    matchId: v.optional(v.id("matches")),
  },
  handler: async (ctx, args) => {
    let payment = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();

    if (!payment) {
      await ctx.db.insert("payments", {
        userId: args.userId,
        stripeSessionId: args.stripeSessionId,
        amount: args.amount,
        paymentType: args.paymentType,
        registrationTier: args.registrationTier,
        matchId: args.matchId,
        status: "pending",
        createdAt: Date.now(),
      });

      payment = await ctx.db
        .query("payments")
        .withIndex("by_session", (q) =>
          q.eq("stripeSessionId", args.stripeSessionId)
        )
        .unique();
    }

    if (!payment) {
      throw new Error("Failed to record payment");
    }

    if (payment.userId !== args.userId) {
      throw new Error("Payment does not belong to user");
    }

    return await applyPaymentCompletion(ctx, payment, args.matchId);
  },
});

export const markPaymentComplete = internalMutation({
  args: {
    userId: v.id("users"),
    stripeSessionId: v.string(),
    matchId: v.optional(v.id("matches")),
  },
  handler: async (ctx, args): Promise<{ alreadyCompleted: boolean }> => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.userId !== args.userId) {
      throw new Error("Payment does not belong to user");
    }

    return await applyPaymentCompletion(ctx, payment, args.matchId);
  },
});

/** Mark a checkout session abandoned when Stripe expires it. */
export const expireCheckoutSession = internalMutation({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();

    if (!payment || payment.status !== "pending") {
      return { updated: false as const };
    }

    await ctx.db.patch(payment._id, { status: "failed" });
    return { updated: true as const };
  },
});

const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Auto-cleanup for abandoned checkouts:
 * - pending older than 24h → failed
 * - user already paid → other pending rows → failed
 * - keep only the newest pending per user when multiple exist
 */
export const reconcileAbandonedPayments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allPayments = await ctx.db.query("payments").collect();
    const now = Date.now();
    const usersWithCompleted = new Set(
      allPayments
        .filter((p) => p.status === "completed")
        .map((p) => p.userId)
    );

    let updated = 0;

    for (const payment of allPayments) {
      if (payment.status !== "pending") continue;

      if (usersWithCompleted.has(payment.userId)) {
        await ctx.db.patch(payment._id, { status: "failed" });
        updated++;
      }
    }

    const pendingByUser = new Map<string, Doc<"payments">[]>();
    for (const payment of allPayments) {
      if (payment.status !== "pending") continue;
      if (usersWithCompleted.has(payment.userId)) continue;

      const key = payment.userId;
      const list = pendingByUser.get(key) ?? [];
      list.push(payment);
      pendingByUser.set(key, list);
    }

    for (const pendingList of pendingByUser.values()) {
      pendingList.sort((a, b) => b.createdAt - a.createdAt);
      for (const stale of pendingList.slice(1)) {
        await ctx.db.patch(stale._id, { status: "failed" });
        updated++;
      }
      const newest = pendingList[0];
      if (newest && now - newest.createdAt > PENDING_MAX_AGE_MS) {
        await ctx.db.patch(newest._id, { status: "failed" });
        updated++;
      }
    }

    return { updated };
  },
});

export const getPaymentStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return { hasPaid: profile?.hasPaid ?? false };
  },
});
