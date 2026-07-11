import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Sliding fixed-window rate limiter backed by `rateLimitBuckets`.
 * Used by public actions (contact form, geolocation) to limit abuse.
 */
export const checkAndIncrement = internalMutation({
  args: {
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!existing || now - existing.windowStart >= args.windowMs) {
      if (existing) {
        await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
      } else {
        await ctx.db.insert("rateLimitBuckets", {
          key: args.key,
          windowStart: now,
          count: 1,
        });
      }
      return { allowed: true as const, remaining: args.limit - 1 };
    }

    if (existing.count >= args.limit) {
      return { allowed: false as const, remaining: 0 };
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return {
      allowed: true as const,
      remaining: args.limit - existing.count - 1,
    };
  },
});
