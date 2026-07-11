import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
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
import { normalizeAuthEmail } from "./lib/authEmail";

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
      if (profile.questionnaireStep === undefined) {
        patch.questionnaireStep = profile.questionnaireComplete
          ? QUESTIONNAIRE_COMPLETE_STEP
          : PROFILE_DEFAULTS.questionnaireStep;
      } else if (
        profile.questionnaireComplete &&
        profile.questionnaireStep < QUESTIONNAIRE_COMPLETE_STEP
      ) {
        patch.questionnaireStep = QUESTIONNAIRE_COMPLETE_STEP;
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

/**
 * One-time: grant free Basic to everyone already in the app.
 * New signups after this still need to pay (men $5 Basic / women free).
 * Premium upgrade remains paid ($15). New-user Premium signup is $20.
 */
export const grandfatherExistingMembersBasicAccess = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let updated = 0;
    let skippedStaff = 0;
    let alreadyPaid = 0;

    for (const profile of profiles) {
      if (isStaffRole(profile.role)) {
        skippedStaff++;
        continue;
      }
      if (profile.hasPaid) {
        alreadyPaid++;
        continue;
      }
      await ctx.db.patch(profile._id, {
        hasPaid: true,
        // Clear trial so PaymentGate / trial banners don't treat them as unpaid trial.
        trialEndsAt: undefined,
      });
      updated++;
    }

    return {
      updated,
      alreadyPaid,
      skippedStaff,
      total: profiles.length,
    };
  },
});

/**
 * Auto-approve everyone who no longer needs review:
 * men (any plan) and Premium women. Leave Basic women pending.
 * @deprecated Prefer syncPaidMenApproval — men should only be approved after payment.
 */
export const autoApproveMembersExemptFromReview = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let updated = 0;
    let skipped = 0;

    for (const profile of profiles) {
      if (isStaffRole(profile.role)) {
        skipped++;
        continue;
      }
      if (!profile.questionnaireComplete) {
        skipped++;
        continue;
      }
      // Women Basic still need admin approval.
      if (profile.gender === "female" && !profile.hasPersonalSupport) {
        skipped++;
        continue;
      }
      // Men: only approve if they have paid.
      if (profile.gender === "male" && !profile.hasPaid) {
        skipped++;
        continue;
      }
      if (profile.approved && profile.reviewStatus === "approved") {
        skipped++;
        continue;
      }
      await ctx.db.patch(profile._id, {
        approved: true,
        reviewStatus: "approved",
      });
      updated++;
    }

    return { updated, skipped, total: profiles.length };
  },
});

/**
 * Men: approved only after payment (not by admin).
 * - Paid men → approve
 * - Unpaid men → clear mistaken admin/auto approval
 * Women Basic left for admin; Premium women already handled on pay.
 */
export const syncPaidMenApproval = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let approved = 0;
    let revoked = 0;
    let skipped = 0;

    for (const profile of profiles) {
      if (isStaffRole(profile.role)) {
        skipped++;
        continue;
      }
      if (profile.gender !== "male") {
        skipped++;
        continue;
      }
      if (!profile.questionnaireComplete) {
        skipped++;
        continue;
      }

      if (profile.hasPaid) {
        if (profile.approved && profile.reviewStatus === "approved") {
          skipped++;
          continue;
        }
        await ctx.db.patch(profile._id, {
          approved: true,
          reviewStatus: "approved",
        });
        approved++;
        continue;
      }

      // Unpaid men must not stay approved / in admin pending.
      if (profile.approved || profile.reviewStatus === "pending_review" || profile.reviewStatus === "approved") {
        await ctx.db.patch(profile._id, {
          approved: false,
          reviewStatus: "incomplete",
        });
        revoked++;
        continue;
      }
      skipped++;
    }

    return { approved, revoked, skipped, total: profiles.length };
  },
});

/** Lowercase legacy emails so one address cannot map to two accounts. */
export const normalizeAuthEmails = internalMutation({
  args: {},
  handler: async (ctx) => {
    let usersUpdated = 0;
    let accountsUpdated = 0;
    let skippedConflicts = 0;

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (!user.email) continue;
      const normalized = normalizeAuthEmail(user.email);
      if (normalized === user.email) continue;

      const conflict = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", normalized))
        .first();
      if (conflict && conflict._id !== user._id) {
        skippedConflicts++;
        continue;
      }

      await ctx.db.patch(user._id, { email: normalized });
      usersUpdated++;
    }

    const accounts = await ctx.db.query("authAccounts").collect();
    for (const account of accounts) {
      if (account.provider !== "password") continue;
      const normalized = normalizeAuthEmail(account.providerAccountId);
      if (normalized === account.providerAccountId) continue;

      const conflict = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", normalized)
        )
        .unique();
      if (conflict && conflict._id !== account._id) {
        skippedConflicts++;
        continue;
      }

      await ctx.db.patch(account._id, { providerAccountId: normalized });
      accountsUpdated++;
    }

    return { usersUpdated, accountsUpdated, skippedConflicts };
  },
});

/** Lock gender on already-paid members (pricing abuse fix). */
export const backfillGenderLocked = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let updated = 0;
    for (const profile of profiles) {
      if (profile.hasPaid && profile.genderLocked !== true) {
        await ctx.db.patch(profile._id, { genderLocked: true });
        updated++;
      }
    }
    return { updated, total: profiles.length };
  },
});

/** Denormalize conversation unread counts (chat list performance). */
export const backfillConversationUnread = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    updated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("conversations").paginate({
      numItems: 40,
      cursor: args.cursor,
    });

    let updated = args.updated ?? 0;

    for (const conversation of page.page) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id)
        )
        .collect();

      const unreadByUser: Record<string, number> = {};
      for (const participant of conversation.participants) {
        unreadByUser[participant] = 0;
      }
      for (const msg of messages) {
        if (msg.read) continue;
        for (const participant of conversation.participants) {
          if (participant !== msg.senderId) {
            unreadByUser[participant] = (unreadByUser[participant] ?? 0) + 1;
          }
        }
      }

      await ctx.db.patch(conversation._id, { unreadByUser });
      updated++;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillConversationUnread, {
        cursor: page.continueCursor,
        updated,
      });
      return { continued: true, updated };
    }

    return { continued: false, updated };
  },
});
