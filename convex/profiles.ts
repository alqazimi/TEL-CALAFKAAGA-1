import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { createUserProfile, ensureUserProfile } from "./lib/createProfile";
import { splitQuestionnaireData } from "./lib/questionnaire";
import { QUESTIONNAIRE_COMPLETE_STEP } from "./lib/profileEnrichment";
import {
  assertStorageOwnership,
  requireActiveProfile,
  requireAuthUserId,
} from "./lib/access";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
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
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

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
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

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
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

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
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    const profile = await ensureUserProfile(ctx, userId);

    if (!profile.profileImageId) {
      throw new Error("Please upload a profile photo before completing your profile.");
    }

    await ctx.db.patch(profile._id, {
      questionnaireComplete: true,
      questionnaireStep: QUESTIONNAIRE_COMPLETE_STEP,
      approved: true,
      verified: true,
      lastSavedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
      userId,
    });

    return profile._id;
  },
});

export const completeRegistrationDetails = mutation({
  args: {
    name: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    const trimmedName = args.name.trim();
    const trimmedPhone = args.phone.trim();

    if (trimmedName.length < 2) {
      throw new Error("Full name is required");
    }
    if (trimmedPhone.length < 8) {
      throw new Error("A valid phone number is required");
    }

    const profile = await ensureUserProfile(ctx, userId);

    await ctx.db.patch(userId, {
      name: trimmedName,
      gender: args.gender,
      phone: trimmedPhone,
    });

    await ctx.db.patch(profile._id, {
      name: trimmedName,
      gender: args.gender,
      phone: trimmedPhone,
      registrationComplete: true,
    });

    const prefs = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (prefs) {
      await ctx.db.patch(prefs._id, {
        preferredGender: args.gender === "male" ? "female" : "male",
      });
    }

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
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    const profile = await ensureUserProfile(ctx, userId);

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.profileImageId !== undefined) {
      await assertStorageOwnership(ctx, userId, args.profileImageId);
      updates.profileImageId = args.profileImageId;
    }

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
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

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
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const registerUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    const existing = await ctx.db
      .query("userUploads")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .unique();

    if (existing) {
      if (existing.userId !== userId) {
        throw new Error("Invalid file upload");
      }
      return existing._id;
    }

    return await ctx.db.insert("userUploads", {
      userId,
      storageId: args.storageId,
      createdAt: Date.now(),
    });
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
