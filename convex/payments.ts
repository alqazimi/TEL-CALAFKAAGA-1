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

export const REGISTRATION_AMOUNT_CENTS = 1500;
export const PERSONAL_SUPPORT_AMOUNT_CENTS = 2000;

const registrationTierValidator = v.union(
  v.literal("basic"),
  v.literal("premium")
);

const paymentTypeValidator = v.union(
  v.literal("registration"),
  v.literal("registration_premium"),
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
      payment.paymentType === "registration_premium";

    await ctx.db.patch(profile._id, {
      hasPaid: true,
      ...(isPremium ? { hasPersonalSupport: true } : {}),
    });
  }

  if (
    payment.paymentType === "registration" ||
    payment.paymentType === "registration_premium" ||
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
