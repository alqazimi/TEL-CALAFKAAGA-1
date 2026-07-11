import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { isEmailTaken, normalizeAuthEmail } from "./lib/authEmail";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return { userId, email: user?.email ?? null, profile };
  },
});

/** Public check used by register UI and UniquePassword sign-up guard. */
export const isEmailRegistered = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await isEmailTaken(ctx, normalizeAuthEmail(args.email));
  },
});

export const getEmailForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.email ?? null;
  },
});
