import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    const sessionId = `cs_${Date.now()}_${userId}`;

    await ctx.db.insert("payments", {
      userId,
      stripeSessionId: sessionId,
      amount: 1500,
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      sessionId,
      url: `/api/stripe/checkout?session_id=${sessionId}&match_id=${args.matchId}`,
      alreadyPaid: false,
    };
  },
});

export const completePayment = mutation({
  args: {
    stripeSessionId: v.string(),
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();

    if (!payment) throw new Error("Payment not found");

    await ctx.db.patch(payment._id, { status: "completed" });

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, { hasPaid: true });
    }

    await ctx.db.patch(args.matchId, { chatUnlocked: true });

    return { success: true };
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
