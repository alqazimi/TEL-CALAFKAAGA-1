import { internalMutation } from "./_generated/server";
import { PROFILE_DEFAULTS } from "./lib/questionnaire";
import {
  QUESTIONNAIRE_COMPLETE_STEP,
  religiousLevelFromPrayer,
} from "./lib/profileEnrichment";
import { getTrialEndsAt } from "./lib/trial";
import {
  hasSubstantialQuestionnaireAnswers,
  isProfileFullyComplete,
} from "./lib/profileCompleteness";
import { isStaffRole } from "./lib/roles";

/** One-time backfill for profiles created before new fields were added. */
export const backfillProfileFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let updated = 0;

    for (const profile of profiles) {
      const legacyProfile = profile as typeof profile & {
        dealBreakers?: string[];
      };
      const patch: Record<string, unknown> = {};
      let needsReplace = false;
      if (profile.spousePrayerImportance === undefined) {
        patch.spousePrayerImportance = PROFILE_DEFAULTS.spousePrayerImportance;
      }
      if (profile.questionnaireStep === undefined || profile.questionnaireStep === 10) {
        patch.questionnaireStep = profile.questionnaireComplete
          ? QUESTIONNAIRE_COMPLETE_STEP
          : PROFILE_DEFAULTS.questionnaireStep;
      }
      if (!profile.religiousLevel?.trim() && profile.prayerFrequency?.trim()) {
        patch.religiousLevel = religiousLevelFromPrayer(profile.prayerFrequency);
      }
      if (
        profile.questionnaireComplete &&
        !profile.hasPaid &&
        profile.trialEndsAt === undefined
      ) {
        patch.trialEndsAt = getTrialEndsAt();
      }
      if ("dealBreakers" in legacyProfile) {
        needsReplace = true;
      }

      if (needsReplace) {
        const { _id, _creationTime, dealBreakers: _dealBreakers, ...rest } = legacyProfile;
        await ctx.db.replace(_id, {
          ...rest,
          ...patch,
        });
        updated++;
        continue;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(profile._id, patch);
        updated++;
      }
    }

    return { updated, total: profiles.length };
  },
});

/**
 * Revoke live approval for members missing required fields.
 * Does NOT clear questionnaireComplete (that wrongly marked finished members incomplete).
 */
export const revokeIncompleteApprovals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let revoked = 0;

    for (const profile of profiles) {
      if (isStaffRole(profile.role)) continue;
      if (!profile.approved) continue;

      const preferences = await ctx.db
        .query("preferences")
        .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
        .unique();

      if (isProfileFullyComplete(profile, preferences)) continue;

      await ctx.db.patch(profile._id, {
        approved: false,
        verified: false,
      });
      revoked++;
    }

    return { revoked, total: profiles.length };
  },
});

/**
 * Restore questionnaireComplete for members who clearly finished the form
 * but were cleared by the old auto-demote logic.
 */
export const restoreClearedQuestionnaireComplete = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let restored = 0;

    for (const profile of profiles) {
      if (isStaffRole(profile.role)) continue;
      if (profile.questionnaireComplete) continue;
      if (!hasSubstantialQuestionnaireAnswers(profile)) continue;

      await ctx.db.patch(profile._id, {
        questionnaireComplete: true,
        questionnaireStep: QUESTIONNAIRE_COMPLETE_STEP,
        approved: false,
        reviewStatus: "pending_review",
      });
      restored++;
    }

    return { restored, total: profiles.length };
  },
});

/**
 * Fix finished members still stored as reviewStatus "incomplete"
 * (create-time default never updated). Safe to run multiple times.
 */
export const syncStaleIncompleteReviewStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let updated = 0;

    for (const profile of profiles) {
      if (isStaffRole(profile.role)) continue;
      if (!profile.questionnaireComplete) continue;
      if (profile.reviewStatus !== "incomplete") continue;

      await ctx.db.patch(profile._id, {
        reviewStatus: profile.approved ? "approved" : "pending_review",
      });
      updated++;
    }

    return { updated, total: profiles.length };
  },
});

/** Strip questionnaire fields removed from the product but still on old documents. */
export const stripLegacyQuestionnaireFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    let preferencesUpdated = 0;
    let profilesUpdated = 0;

    for (const pref of await ctx.db.query("preferences").collect()) {
      if (!("readyToRelocate" in pref)) continue;
      const { _id, _creationTime, readyToRelocate: _readyToRelocate, ...rest } =
        pref as typeof pref & { readyToRelocate?: string };
      await ctx.db.replace(_id, rest);
      preferencesUpdated++;
    }

    for (const profile of await ctx.db.query("profiles").collect()) {
      const legacy = profile as typeof profile & { readyToRelocate?: string };
      if (!("readyToRelocate" in legacy)) continue;
      const { _id, _creationTime, readyToRelocate: _readyToRelocate, ...rest } =
        legacy;
      await ctx.db.replace(_id, rest);
      profilesUpdated++;
    }

    return { preferencesUpdated, profilesUpdated };
  },
});

/**
 * Backfill independent `reviewStatus` from legacy approved/banned/questionnaire flags.
 * Safe to run multiple times. Does not change approved/verified booleans.
 */
export const backfillReviewStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let updated = 0;

    for (const profile of profiles) {
      if (profile.reviewStatus) continue;

      let reviewStatus:
        | "incomplete"
        | "pending_review"
        | "approved"
        | "rejected"
        | "suspended";

      if (profile.banned) {
        reviewStatus = "suspended";
      } else if (isStaffRole(profile.role) || profile.approved) {
        reviewStatus = "approved";
      } else if (profile.questionnaireComplete) {
        // Legacy auto-approved members already have approved=true above.
        // Remaining complete-but-unapproved → pending.
        reviewStatus = "pending_review";
      } else {
        reviewStatus = "incomplete";
      }

      await ctx.db.patch(profile._id, {
        reviewStatus,
        // Clear misleading verified flag; approval is the trust gate.
        ...(profile.verified ? { verified: false } : {}),
      });
      updated++;
    }

    return { updated, total: profiles.length };
  },
});
