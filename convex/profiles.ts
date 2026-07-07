import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { createUserProfile, ensureUserProfile } from "./lib/createProfile";
import { splitQuestionnaireData } from "./lib/questionnaire";

export const getProfile = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const targetId = args.userId ?? authUserId;
    if (!targetId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", targetId))
      .unique();

    if (!profile) return null;

    let imageUrl = null;
    if (profile.profileImageId) {
      imageUrl = await ctx.storage.getUrl(profile.profileImageId);
    }

    return { ...profile, imageUrl };
  },
});

export const createProfile = mutation({
  args: {
    name: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) throw new Error("Profile already exists");

    return await createUserProfile(ctx, userId, {
      name: args.name,
      gender: args.gender,
      phone: args.phone,
    });
  },
});

export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ensureUserProfile(ctx, userId);
  },
});

export const updateQuestionnaire = mutation({
  args: {
    step: v.number(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ensureUserProfile(ctx, userId);

    const { profileUpdates, preferences } = splitQuestionnaireData(
      args.data as Record<string, unknown>
    );

    const updates: Record<string, unknown> = {
      ...profileUpdates,
      questionnaireStep: args.step,
      lastSavedAt: Date.now(),
    };

    await ctx.db.patch(profile._id, updates);

    if (preferences && Object.keys(preferences).length > 0) {
      const prefs = await ctx.db
        .query("preferences")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (prefs) {
        await ctx.db.patch(prefs._id, preferences);
      }
    }

    if (args.step >= 2) {
      await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
        userId,
      });
    }

    return profile._id;
  },
});

export const autoSaveProfile = mutation({
  args: {
    step: v.number(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ensureUserProfile(ctx, userId);
    if (profile.questionnaireComplete) return profile._id;

    const { profileUpdates, preferences } = splitQuestionnaireData(
      args.data as Record<string, unknown>
    );

    if (Object.keys(profileUpdates).length === 0 && !preferences) {
      return profile._id;
    }

    const updates: Record<string, unknown> = {
      ...profileUpdates,
      questionnaireStep: args.step,
      lastSavedAt: Date.now(),
    };

    if (Object.keys(profileUpdates).length > 0) {
      await ctx.db.patch(profile._id, updates);
    } else {
      await ctx.db.patch(profile._id, {
        questionnaireStep: args.step,
        lastSavedAt: Date.now(),
      });
    }

    if (preferences && Object.keys(preferences).length > 0) {
      const prefs = await ctx.db
        .query("preferences")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (prefs) {
        await ctx.db.patch(prefs._id, preferences);
      }
    }

    return profile._id;
  },
});

export const completeQuestionnaire = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ensureUserProfile(ctx, userId);

    await ctx.db.patch(profile._id, {
      questionnaireComplete: true,
      questionnaireStep: 9,
      lastSavedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
      userId,
    });

    return profile._id;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    profileImageId: v.optional(v.id("_storage")),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ensureUserProfile(ctx, userId);

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.profileImageId !== undefined) updates.profileImageId = args.profileImageId;
    if (args.phone !== undefined) updates.phone = args.phone;

    await ctx.db.patch(profile._id, updates);

    await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
      userId,
    });

    return profile._id;
  },
});

/** Save questionnaire field edits after profile is complete. */
export const saveProfileEdits = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ensureUserProfile(ctx, userId);

    const { profileUpdates, preferences } = splitQuestionnaireData(
      args.data as Record<string, unknown>
    );

    if (Object.keys(profileUpdates).length > 0) {
      await ctx.db.patch(profile._id, {
        ...profileUpdates,
        lastSavedAt: Date.now(),
      });
    }

    if (preferences && Object.keys(preferences).length > 0) {
      const prefs = await ctx.db
        .query("preferences")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (prefs) {
        await ctx.db.patch(prefs._id, preferences);
      }
    }

    await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
      userId,
    });

    return profile._id;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const searchUsers = query({
  args: {
    country: v.optional(v.string()),
    minAge: v.optional(v.number()),
    maxAge: v.optional(v.number()),
    minHeight: v.optional(v.number()),
    maxHeight: v.optional(v.number()),
    religiousLevel: v.optional(v.string()),
    education: v.optional(v.string()),
    occupation: v.optional(v.string()),
    children: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!myProfile) return [];

    const allProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .collect();

    const myPrefs = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const oppositeGender = myProfile.gender === "male" ? "female" : "male";

    const filtered = allProfiles.filter((p) => {
      if (p.userId === userId) return false;
      if (p.banned) return false;
      if (!p.questionnaireComplete) return false;
      if (p.gender !== oppositeGender) return false;
      if (args.country && p.country !== args.country) return false;
      if (args.minAge && p.age < args.minAge) return false;
      if (args.maxAge && p.age > args.maxAge) return false;
      if (args.minHeight && p.height < args.minHeight) return false;
      if (args.maxHeight && p.height > args.maxHeight) return false;
      if (args.religiousLevel && p.religiousLevel !== args.religiousLevel) return false;
      if (args.education && p.education !== args.education) return false;
      if (args.occupation && p.occupation !== args.occupation) return false;
      if (args.children !== undefined && p.children !== args.children) return false;
      return true;
    });

    const results = await Promise.all(
      filtered.map(async (p) => {
        const score = await ctx.db
          .query("compatibilityScores")
          .withIndex("by_pair", (q) =>
            q.eq("userA", userId).eq("userB", p.userId)
          )
          .unique();

        let imageUrl = null;
        if (p.profileImageId) {
          imageUrl = await ctx.storage.getUrl(p.profileImageId);
        }

        return {
          ...p,
          imageUrl,
          score: score?.score ?? 0,
        };
      })
    );

    return results
      .filter((r) => r.score >= 70)
      .sort((a, b) => b.score - a.score);
  },
});
