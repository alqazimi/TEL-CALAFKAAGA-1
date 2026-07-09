import { internalMutation } from "./_generated/server";
import { PROFILE_DEFAULTS } from "./lib/questionnaire";
import {
  QUESTIONNAIRE_COMPLETE_STEP,
  religiousLevelFromPrayer,
} from "./lib/profileEnrichment";
import { getTrialEndsAt } from "./lib/trial";

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
      if (profile.questionnaireComplete && !profile.approved) {
        patch.approved = true;
        patch.verified = true;
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
