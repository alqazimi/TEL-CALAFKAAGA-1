import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { calculateCompatibility } from "./matching";

export const recalculateScores = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!userProfile || !userProfile.questionnaireComplete) return;

    const userPrefs = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!userPrefs) return;

    const allProfiles = await ctx.db.query("profiles").collect();

    const oppositeGender =
      userProfile.gender === "male" ? "female" : "male";

    const candidates = allProfiles.filter(
      (p) =>
        p.userId !== args.userId &&
        p.gender === oppositeGender &&
        p.questionnaireComplete &&
        !p.banned
    );

    for (const candidate of candidates) {
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
  },
});
