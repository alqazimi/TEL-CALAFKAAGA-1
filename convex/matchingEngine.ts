import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { calculateCompatibility } from "./matching";
import { isDiscoverable } from "./lib/reviewStatus";

/** Keep each OCC transaction small — wide profile scans caused massive retries. */
const SCORE_PAGE_SIZE = 20;

export const recalculateScores = internalMutation({
  args: {
    userId: v.id("users"),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!userProfile || !isDiscoverable(userProfile)) return;

    const userPrefs = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userProfile.userId))
      .unique();

    if (!userPrefs) return;

    const oppositeGender =
      userProfile.gender === "male" ? "female" : "male";

    const page = await ctx.db
      .query("profiles")
      .withIndex("by_gender", (q) => q.eq("gender", oppositeGender))
      .paginate({
        numItems: SCORE_PAGE_SIZE,
        cursor: args.cursor ?? null,
      });

    for (const candidate of page.page) {
      if (candidate.userId === args.userId) continue;
      if (!isDiscoverable(candidate)) continue;

      const candidatePrefs = await ctx.db
        .query("preferences")
        .withIndex("by_userId", (q) => q.eq("userId", candidate.userId))
        .unique();

      if (!candidatePrefs) continue;

      const scoreAB = calculateCompatibility(
        userProfile,
        userPrefs,
        candidate,
        candidatePrefs
      );

      const scoreBA = calculateCompatibility(
        candidate,
        candidatePrefs,
        userProfile,
        userPrefs
      );

      const avgScore = Math.round((scoreAB + scoreBA) / 2);

      const existingAB = await ctx.db
        .query("compatibilityScores")
        .withIndex("by_pair", (q) =>
          q.eq("userA", args.userId).eq("userB", candidate.userId)
        )
        .unique();

      if (existingAB) {
        await ctx.db.patch(existingAB._id, { score: avgScore });
      } else {
        await ctx.db.insert("compatibilityScores", {
          userA: args.userId,
          userB: candidate.userId,
          score: avgScore,
        });
      }

      const existingBA = await ctx.db
        .query("compatibilityScores")
        .withIndex("by_pair", (q) =>
          q.eq("userA", candidate.userId).eq("userB", args.userId)
        )
        .unique();

      if (existingBA) {
        await ctx.db.patch(existingBA._id, { score: avgScore });
      } else {
        await ctx.db.insert("compatibilityScores", {
          userA: candidate.userId,
          userB: args.userId,
          score: avgScore,
        });
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
        userId: args.userId,
        cursor: page.continueCursor,
      });
    }
  },
});

/** Recompute every discoverable member's stored scores (e.g. after weight changes). */
export const recalculateAllScores = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_reviewStatus", (q) => q.eq("reviewStatus", "approved"))
      .collect();
    let scheduled = 0;
    for (const profile of profiles) {
      if (!isDiscoverable(profile)) continue;
      await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
        userId: profile.userId,
      });
      scheduled++;
    }
    return { scheduled };
  },
});
