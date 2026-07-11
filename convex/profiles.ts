import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { createUserProfile, ensureUserProfile } from "./lib/createProfile";
import {
  CONTACT_COMPLETE_STEP,
  CONTACT_IN_PROGRESS_STEP,
  hasValidContact,
  pruneIncompleteAutosaveWrites,
  sanitizeContactProfileUpdates,
  splitQuestionnaireData,
} from "./lib/questionnaire";
import { isDiscoverable } from "./lib/reviewStatus";
import { isValidContactPhone } from "./lib/phone";
import { QUESTIONNAIRE_COMPLETE_STEP } from "./lib/profileEnrichment";
import { assertProfileFullyComplete } from "./lib/profileCompleteness";
import {
  assertStorageOwnership,
  requireActiveProfile,
  requireAuthUserId,
} from "./lib/access";
import {
  isPremiumMember,
  MAX_ADDITIONAL_PHOTOS,
  MAX_PROFILE_PHOTOS,
} from "./lib/premium";
import { getTrialEndsAt, isInTrialPeriod } from "./lib/trial";
import { hasActiveMatch } from "./lib/matchPresentation";
import { sendNotification } from "./lib/sendNotification";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function syncContactDetails(
  ctx: MutationCtx,
  userId: Id<"users">,
  name: string,
  phone: string
) {
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  if (trimmedName.length < 2) {
    throw new Error("Full name is required");
  }
  if (!isValidContactPhone(trimmedPhone)) {
    throw new Error("A valid phone number is required");
  }

  await ctx.db.patch(userId, {
    name: trimmedName,
    phone: trimmedPhone,
  });

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (profile) {
    await ctx.db.patch(profile._id, {
      name: trimmedName,
      phone: trimmedPhone,
    });
  }
}

async function syncGenderSideEffects(
  ctx: MutationCtx,
  userId: Id<"users">,
  gender: "male" | "female"
) {
  await ctx.db.patch(userId, { gender });
  const prefs = await ctx.db
    .query("preferences")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (prefs) {
    await ctx.db.patch(prefs._id, {
      preferredGender: gender === "male" ? "female" : "male",
    });
  }
}

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

    const additionalImageUrls = await Promise.all(
      (profile.additionalImageIds ?? []).map(async (id) => {
        return (await ctx.storage.getUrl(id)) ?? null;
      })
    );

    return {
      ...profile,
      imageUrl,
      additionalImageUrls: additionalImageUrls.filter(
        (url): url is string => url !== null
      ),
      isPremium: isPremiumMember(profile),
      isInTrial: isInTrialPeriod(profile),
    };
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

    sanitizeContactProfileUpdates(profileUpdates);

    if (args.step > CONTACT_COMPLETE_STEP && !hasValidContact(profile, profileUpdates)) {
      throw new Error("Please add your full name and phone number before continuing.");
    }
    if (args.step === CONTACT_COMPLETE_STEP && !hasValidContact(profile, profileUpdates)) {
      throw new Error("Please add your full name and phone number before continuing.");
    }

    const genderUpdate = profileUpdates.gender;
    if (genderUpdate === "male" || genderUpdate === "female") {
      await syncGenderSideEffects(ctx, userId, genderUpdate);
    }

    const nameUpdate = profileUpdates.name;
    const phoneUpdate = profileUpdates.phone;
    if (hasValidContact(profile, profileUpdates)) {
      await ctx.db.patch(userId, {
        name: nameUpdate as string,
        phone: phoneUpdate as string,
      });
    }

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

    // Only score discoverable members — mid-questionnaire recalc caused heavy OCC with autosave.
    const updated = await ctx.db.get(profile._id);
    if (updated && isDiscoverable(updated)) {
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

    sanitizeContactProfileUpdates(profileUpdates);
    pruneIncompleteAutosaveWrites(profileUpdates, preferences);

    if (Object.keys(profileUpdates).length === 0 && (!preferences || Object.keys(preferences).length === 0)) {
      return profile._id;
    }

    const genderUpdate = profileUpdates.gender;
    if (genderUpdate === "male" || genderUpdate === "female") {
      await syncGenderSideEffects(ctx, userId, genderUpdate);
    }

    if (hasValidContact(profile, profileUpdates)) {
      await ctx.db.patch(userId, {
        name: profileUpdates.name as string,
        phone: profileUpdates.phone as string,
      });
    }

    let stepToSave = args.step;
    if (stepToSave >= CONTACT_COMPLETE_STEP && !hasValidContact(profile, profileUpdates)) {
      stepToSave = Math.min(
        profile.questionnaireStep ?? CONTACT_IN_PROGRESS_STEP,
        CONTACT_IN_PROGRESS_STEP
      );
    }

    const updates: Record<string, unknown> = {
      ...profileUpdates,
      questionnaireStep: stepToSave,
      lastSavedAt: Date.now(),
    };

    if (Object.keys(profileUpdates).length > 0) {
      await ctx.db.patch(profile._id, updates);
    } else {
      await ctx.db.patch(profile._id, {
        questionnaireStep: stepToSave,
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
    if (profile.questionnaireComplete) {
      return profile._id;
    }

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    assertProfileFullyComplete(profile, preferences);

    await ctx.db.patch(profile._id, {
      questionnaireComplete: true,
      questionnaireStep: QUESTIONNAIRE_COMPLETE_STEP,
      lastSavedAt: Date.now(),
      // Independent states — completing the form does NOT mean verified/approved.
      reviewStatus: "pending_review",
      approved: false,
      verified: false,
      ...(!profile.hasPaid && profile.trialEndsAt === undefined
        ? { trialEndsAt: getTrialEndsAt() }
        : {}),
    });

    await sendNotification(ctx, {
      userId,
      type: "approval",
      title: "Profile submitted for review",
      body: "Your questionnaire is complete. An admin will review your profile shortly. You will be notified when you can browse matches.",
      sendEmail: true,
    });

    // Scores wait until admin approval makes the profile discoverable.
    return profile._id;
  },
});

export const completeRegistrationGender = mutation({
  args: {
    gender: v.union(v.literal("male"), v.literal("female")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    const profile = await ensureUserProfile(ctx, userId);
    await syncGenderSideEffects(ctx, userId, args.gender);

    await ctx.db.patch(profile._id, {
      gender: args.gender,
      registrationComplete: true,
    });

    return profile._id;
  },
});

export const completeRegistrationDetails = mutation({
  args: {
    name: v.string(),
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
    if (!isValidContactPhone(trimmedPhone)) {
      throw new Error("A valid phone number is required");
    }

    const profile = await ensureUserProfile(ctx, userId);

    await ctx.db.patch(userId, {
      name: trimmedName,
      phone: trimmedPhone,
    });

    await ctx.db.patch(profile._id, {
      name: trimmedName,
      phone: trimmedPhone,
      registrationComplete: true,
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
    photoVisibility: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("matches"),
        v.literal("private")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    const profile = await ensureUserProfile(ctx, userId);

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.photoVisibility !== undefined) {
      updates.photoVisibility = args.photoVisibility;
    }
    if (args.profileImageId !== undefined) {
      await assertStorageOwnership(ctx, userId, args.profileImageId);
      updates.profileImageId = args.profileImageId;
    }

    await ctx.db.patch(profile._id, updates);

    const updated = await ctx.db.get(profile._id);
    if (updated && isDiscoverable(updated)) {
      await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
        userId,
      });
    }

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

    sanitizeContactProfileUpdates(profileUpdates);

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

    const updated = await ctx.db.get(profile._id);
    if (updated && isDiscoverable(updated)) {
      await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
        userId,
      });
    }

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

export const updateWaliContact = mutation({
  args: {
    waliName: v.optional(v.string()),
    waliPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const profile = await requireActiveProfile(ctx, userId);

    if (!isPremiumMember(profile)) {
      throw new Error("Wali contact is available on the premium plan");
    }

    const waliName = args.waliName?.trim() ?? "";
    const waliPhone = args.waliPhone?.trim() ?? "";

    if (waliName && waliName.length < 2) {
      throw new Error("Wali name is too short");
    }
    if (waliPhone && waliPhone.length < 8) {
      throw new Error("Wali phone number is invalid");
    }

    await ctx.db.patch(profile._id, {
      waliName: waliName || undefined,
      waliPhone: waliPhone || undefined,
    });

    return profile._id;
  },
});

export const addAdditionalPhoto = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const profile = await requireActiveProfile(ctx, userId);

    if (!isPremiumMember(profile)) {
      throw new Error("Extra photos are available on the premium plan");
    }

    await assertStorageOwnership(ctx, userId, args.storageId);

    const existing = profile.additionalImageIds ?? [];
    const totalPhotos = (profile.profileImageId ? 1 : 0) + existing.length;
    if (totalPhotos >= MAX_PROFILE_PHOTOS) {
      throw new Error(`You can upload up to ${MAX_PROFILE_PHOTOS} photos`);
    }
    if (existing.length >= MAX_ADDITIONAL_PHOTOS) {
      throw new Error(`You can upload up to ${MAX_ADDITIONAL_PHOTOS} extra photos`);
    }

    await ctx.db.patch(profile._id, {
      additionalImageIds: [...existing, args.storageId],
    });

    return profile._id;
  },
});

export const removeAdditionalPhoto = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const profile = await requireActiveProfile(ctx, userId);

    if (!isPremiumMember(profile)) {
      throw new Error("Extra photos are available on the premium plan");
    }

    const existing = profile.additionalImageIds ?? [];
    if (!existing.includes(args.storageId)) {
      throw new Error("Photo not found");
    }

    await ctx.db.patch(profile._id, {
      additionalImageIds: existing.filter((id) => id !== args.storageId),
    });

    return profile._id;
  },
});

export const getWaliForMatch = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const isMatch = await hasActiveMatch(ctx, userId, args.targetUserId);
    if (!isMatch) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();

    if (!profile?.waliName && !profile?.waliPhone) return null;

    return {
      waliName: profile.waliName ?? null,
      waliPhone: profile.waliPhone ?? null,
    };
  },
});
