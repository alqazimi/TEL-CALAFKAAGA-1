import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

export const REGISTRATION_AMOUNT_CENTS = 1500;

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
    paymentType: v.union(v.literal("registration"), v.literal("chat")),
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
      matchId: args.matchId,
      status: "pending",
      createdAt: Date.now(),
    });
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

    if (payment.status === "completed") {
      return { alreadyCompleted: true };
    }

    await ctx.db.patch(payment._id, { status: "completed" });

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, { hasPaid: true });
    }

    if (payment.paymentType === "registration" || payment.paymentType === undefined) {
      const matchesA = await ctx.db
        .query("matches")
        .withIndex("by_userA", (q) => q.eq("userA", args.userId))
        .collect();
      const matchesB = await ctx.db
        .query("matches")
        .withIndex("by_userB", (q) => q.eq("userB", args.userId))
        .collect();

      for (const match of [...matchesA, ...matchesB]) {
        if (!match.chatUnlocked) {
          await ctx.db.patch(match._id, { chatUnlocked: true });
        }
      }
    } else if (args.matchId) {
      await ctx.db.patch(args.matchId, { chatUnlocked: true });
    }

    return { alreadyCompleted: false };
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

/** @deprecated Use Stripe checkout actions instead. */
export const createCheckoutSession = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (profile?.hasPaid) {
      await ctx.db.patch(args.matchId, { chatUnlocked: true });
      return { alreadyPaid: true };
    }

    throw new Error("Use Stripe checkout to complete payment");
  },
});

/** @deprecated Use verifyCheckoutSession action instead. */
export const completePayment = mutation({
  args: {
    stripeSessionId: v.string(),
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    throw new Error("Use Stripe checkout to complete payment");
  },
});
