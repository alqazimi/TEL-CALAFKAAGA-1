import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  getProfileForUser,
  hasAnyStaff,
  normalizeEmail,
  requireAdmin,
  requireOwner,
  verifyBootstrapCredentials,
} from "./lib/adminAuth";
import { isOwnerRole, isStaffRole, STAFF_PROFILE_COMPLETION_PATCH } from "./lib/roles";
import { assertProfileFullyComplete } from "./lib/profileCompleteness";
import { QUESTIONNAIRE_COMPLETE_STEP } from "./lib/profileEnrichment";
import { sendNotification } from "./lib/sendNotification";
import { isPremiumMember } from "./lib/premium";
import { deleteMemberAccount } from "./lib/deleteUser";
import { writeAuditLog } from "./lib/auditLog";
import { isInTrialPeriod } from "./lib/trial";
import { resolveReviewStatus } from "./lib/reviewStatus";

function pendingApprovalPriority(
  profile: { approved: boolean; reviewStatus?: string; hasPersonalSupport?: boolean },
  paidCents: number
): number {
  if (profile.approved || profile.reviewStatus === "approved") return 2;
  return isPremiumMember(profile, paidCents) ? 0 : 1;
}

export const hasAnyAdmin = query({
  args: {},
  handler: async (ctx) => {
    return await hasAnyStaff(ctx);
  },
});

export const getBootstrapStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        hasAdmins: await hasAnyStaff(ctx),
        canClaim: false,
        reason: "not_authenticated" as const,
      };
    }

    const hasStaff = await hasAnyStaff(ctx);
    if (hasStaff) {
      return { hasAdmins: true, canClaim: false, reason: "admins_exist" as const };
    }

    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!bootstrapEmail || !bootstrapSecret) {
      return { hasAdmins: false, canClaim: false, reason: "not_configured" as const };
    }

    const user = await ctx.db.get(userId);
    const userEmail = user?.email;
    if (!userEmail) {
      return { hasAdmins: false, canClaim: false, reason: "no_email" as const };
    }

    if (normalizeEmail(userEmail) !== normalizeEmail(bootstrapEmail)) {
      return { hasAdmins: false, canClaim: false, reason: "email_mismatch" as const };
    }

    return { hasAdmins: false, canClaim: true, reason: "ready" as const };
  },
});

export const claimFirstAdmin = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (await hasAnyStaff(ctx)) {
      throw new Error("An owner or admin already exists.");
    }

    const user = await ctx.db.get(userId);
    verifyBootstrapCredentials(args.secret, user?.email);

    const profile = await getProfileForUser(ctx, userId);
    if (!profile) throw new Error("Profile not found.");

    await ctx.db.patch(profile._id, {
      role: "owner",
      ...STAFF_PROFILE_COMPLETION_PATCH,
    });
    return { success: true };
  },
});

export const setUserRole = mutation({
  args: {
    profileId: v.id("profiles"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOwner(ctx, userId);

    const targetProfile = await ctx.db.get(args.profileId);
    if (!targetProfile) throw new Error("Profile not found.");

    if (isOwnerRole(targetProfile.role)) {
      throw new Error("The owner role cannot be changed.");
    }

    if (args.role === "admin") {
      throw new Error("Admins must be invited. Use Invite admin on the Users tab.");
    }

    if (targetProfile.role === args.role) return;

    await ctx.db.patch(args.profileId, {
      role: args.role,
    });

    await writeAuditLog(ctx, {
      actorUserId: userId,
      action: "set_role",
      targetUserId: targetProfile.userId,
      targetProfileId: args.profileId,
      metadata: { role: args.role },
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const caller = await getProfileForUser(ctx, userId);
    if (!caller || !isStaffRole(caller.role)) return null;

    // Profiles only — avoid scanning payments/messages (was hanging the admin UI).
    const profiles = await ctx.db.query("profiles").collect();
    const members = profiles.filter((p) => !isStaffRole(p.role));

    const paidBasicCount = members.filter(
      (p) => p.hasPaid && !p.hasPersonalSupport
    ).length;
    const paidPremiumCount = members.filter((p) => !!p.hasPersonalSupport).length;
    const unpaidCount = members.filter((p) => !p.hasPaid).length;
    const trialCount = members.filter(
      (p) => !p.hasPaid && isInTrialPeriod(p)
    ).length;
    // Approximate revenue from known plan prices (cents).
    const revenue = paidBasicCount * 1000 + paidPremiumCount * 2000;

    // Lightweight counts — capped scans to avoid hanging the admin UI.
    const matchSample = await ctx.db.query("matches").take(500);
    const messageSample = await ctx.db.query("messages").take(500);
    const activeMatches = matchSample.filter((m) => m.status === "active").length;

    return {
      totalUsers: profiles.length,
      maleUsers: profiles.filter((p) => p.gender === "male").length,
      femaleUsers: profiles.filter((p) => p.gender === "female").length,
      totalMatches: activeMatches,
      totalMessages: messageSample.length,
      revenue,
      paidBasicCount,
      paidPremiumCount,
      unpaidCount,
      trialCount,
      pendingApproval: members.filter(
        (p) =>
          p.questionnaireComplete &&
          !p.approved &&
          p.reviewStatus !== "approved" &&
          p.reviewStatus !== "rejected" &&
          p.reviewStatus !== "suspended"
      ).length,
      bannedUsers: profiles.filter((p) => p.banned).length,
      isOwner: isOwnerRole(caller.role),
    };
  },
});

export const getAllUsers = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("all"),
        v.literal("user"),
        v.literal("admin"),
        v.literal("owner")
      )
    ),
    payment: v.optional(
      v.union(
        v.literal("all"),
        v.literal("unpaid"),
        v.literal("paid"),
        v.literal("basic"),
        v.literal("premium")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    await requireAdmin(ctx, userId);

    const limit = Math.min(Math.max(args.limit ?? 80, 1), 150);
    const search = args.search?.trim().toLowerCase();

    // Fast path: recent profiles only (no full-table scan for the default list).
    let profiles = search
      ? await ctx.db.query("profiles").collect()
      : await ctx.db.query("profiles").order("desc").take(Math.max(limit * 3, 120));

    if (search) {
      const matched: typeof profiles = [];
      for (const p of profiles) {
        const user = await ctx.db.get(p.userId);
        const email = user?.email?.toLowerCase() ?? "";
        if (
          p.name.toLowerCase().includes(search) ||
          (p.country ?? "").toLowerCase().includes(search) ||
          (p.city ?? "").toLowerCase().includes(search) ||
          email.includes(search) ||
          (p.phone ?? "").toLowerCase().includes(search)
        ) {
          matched.push(p);
        }
        if (matched.length >= limit * 2) break;
      }
      profiles = matched;
    }

    if (args.role && args.role !== "all") {
      profiles = profiles.filter((p) => p.role === args.role);
    }

    if (args.payment && args.payment !== "all") {
      profiles = profiles.filter((p) => {
        if (isStaffRole(p.role)) return false;
        switch (args.payment) {
          case "unpaid":
            return !p.hasPaid;
          case "paid":
            return !!p.hasPaid;
          case "premium":
            return !!p.hasPersonalSupport;
          case "basic":
            return !!p.hasPaid && !p.hasPersonalSupport;
          default:
            return true;
        }
      });
    }

    profiles.sort((a, b) => {
      const priorityDiff =
        pendingApprovalPriority(a, a.hasPersonalSupport ? 2000 : a.hasPaid ? 1000 : 0) -
        pendingApprovalPriority(b, b.hasPersonalSupport ? 2000 : b.hasPaid ? 1000 : 0);
      if (priorityDiff !== 0) return priorityDiff;
      return b._creationTime - a._creationTime;
    });

    const page = profiles.slice(0, limit);

    return await Promise.all(
      page.map(async (p) => {
        let imageUrl = null;
        if (p.profileImageId) {
          imageUrl = await ctx.storage.getUrl(p.profileImageId);
        }
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          imageUrl,
          paidCents: p.hasPersonalSupport ? 2000 : p.hasPaid ? 1000 : 0,
          email: user?.email ?? null,
        };
      })
    );
  },
});

export const getAllPayments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    await requireAdmin(ctx, userId);

    const allPayments = await ctx.db.query("payments").collect();
    const payments = allPayments
      .filter((p) => p.status === "completed")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100);

    return await Promise.all(
      payments.map(async (payment) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", payment.userId))
          .unique();
        const user = await ctx.db.get(payment.userId);

        return {
          _id: payment._id,
          userId: payment.userId,
          stripeSessionId: payment.stripeSessionId,
          amount: payment.amount,
          paymentType: payment.paymentType,
          registrationTier: payment.registrationTier,
          status: payment.status,
          createdAt: payment.createdAt,
          userName: profile?.name ?? "Unknown",
          userEmail: user?.email ?? null,
          userPhone: profile?.phone ?? null,
        };
      })
    );
  },
});

export const getUserDetail = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireAdmin(ctx, userId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const user = await ctx.db.get(profile.userId);
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
      .unique();

    let imageUrl = null;
    if (profile.profileImageId) {
      imageUrl = await ctx.storage.getUrl(profile.profileImageId);
    }

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect();
    const paidCents = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      profile: {
        ...profile,
        imageUrl,
        email: user?.email ?? null,
        paidCents,
      },
      preferences,
    };
  },
});

export const setAdvisorReviewed = mutation({
  args: {
    profileId: v.id("profiles"),
    advisorReviewed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");
    if (!isPremiumMember(profile)) {
      throw new Error("Advisor review is only for premium members");
    }

    await ctx.db.patch(args.profileId, {
      advisorReviewed: args.advisorReviewed,
    });
  },
});

export const approveUser = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");
    if (profile.reviewStatus === "approved" || (profile.approved && !profile.reviewStatus)) {
      // Already approved (including legacy docs without reviewStatus)
      if (profile.reviewStatus !== "approved") {
        await ctx.db.patch(args.profileId, {
          reviewStatus: "approved",
          verified: false,
        });
      }
      return;
    }

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
      .unique();

    assertProfileFullyComplete(profile, preferences);

    await ctx.db.patch(args.profileId, {
      approved: true,
      verified: false, // verification is a separate future trust signal
      reviewStatus: "approved",
      questionnaireComplete: true,
      questionnaireStep: QUESTIONNAIRE_COMPLETE_STEP,
    });

    await sendNotification(ctx, {
      userId: profile.userId,
      type: "approval",
      title: "Profile approved",
      body: "Your profile was approved. You can now browse matches and connect with members.",
      sendEmail: true,
    });

    await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
      userId: profile.userId,
    });

    await writeAuditLog(ctx, {
      actorUserId: userId,
      action: "approve_user",
      targetUserId: profile.userId,
      targetProfileId: args.profileId,
    });
  },
});

export const rejectUser = mutation({
  args: {
    profileId: v.id("profiles"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");
    if (isStaffRole(profile.role)) {
      throw new Error("Cannot reject a staff account");
    }

    await ctx.db.patch(args.profileId, {
      approved: false,
      verified: false,
      reviewStatus: "rejected",
    });

    await sendNotification(ctx, {
      userId: profile.userId,
      type: "approval",
      title: "Sawirka profile-ka",
      body:
        args.reason?.trim() ||
        "Fadlan geli sawirkaaga saxda ah si uu kuu furmo. Mahadsanid.",
      sendEmail: true,
      emailCta: { label: "Cusboonaysii sawirka", path: "/profile" },
    });

    await writeAuditLog(ctx, {
      actorUserId: userId,
      action: "reject_user",
      targetUserId: profile.userId,
      targetProfileId: args.profileId,
      metadata: args.reason?.trim() ? { reason: args.reason.trim() } : undefined,
    });
  },
});

export const banUser = mutation({
  args: { profileId: v.id("profiles"), banned: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const target = await ctx.db.get(args.profileId);
    if (target && isOwnerRole(target.role)) {
      throw new Error("Cannot ban the owner account.");
    }

    await ctx.db.patch(args.profileId, {
      banned: args.banned,
      ...(args.banned
        ? { reviewStatus: "suspended" as const }
        : profileRestoredReviewStatus(target)),
    });

    if (target) {
      await writeAuditLog(ctx, {
        actorUserId: userId,
        action: args.banned ? "ban_user" : "unban_user",
        targetUserId: target.userId,
        targetProfileId: args.profileId,
      });
    }
  },
});

function profileRestoredReviewStatus(
  target: { questionnaireComplete?: boolean; approved?: boolean } | null
) {
  if (!target) return {};
  if (target.approved) return { reviewStatus: "approved" as const };
  if (target.questionnaireComplete) return { reviewStatus: "pending_review" as const };
  return { reviewStatus: "incomplete" as const };
}
export const deleteUser = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) return { success: true, alreadyGone: true };

    if (isStaffRole(profile.role)) {
      throw new Error("Cannot delete an admin or owner account. Remove their role first.");
    }

    if (profile.userId === userId) {
      throw new Error("You cannot delete your own account from the admin panel.");
    }

    await writeAuditLog(ctx, {
      actorUserId: userId,
      action: "delete_user",
      targetUserId: profile.userId,
      targetProfileId: args.profileId,
      metadata: { name: profile.name },
    });

    const result = await deleteMemberAccount(ctx, args.profileId);
    return { success: true, deleted: result.deleted };
  },
});

type AnnouncementAudience = "all" | "paid" | "trial" | "unpaid";

async function fanOutAnnouncement(
  ctx: MutationCtx,
  args: {
    title: string;
    body: string;
    audience: AnnouncementAudience;
  }
) {
  const now = Date.now();
  const profiles = await ctx.db.query("profiles").collect();
  let delivered = 0;

  for (const profile of profiles) {
    if (isStaffRole(profile.role)) continue;
    if (args.audience === "paid" && !profile.hasPaid) continue;
    if (args.audience === "unpaid" && profile.hasPaid) continue;
    if (
      args.audience === "trial" &&
      !(!profile.hasPaid && isInTrialPeriod(profile))
    ) {
      continue;
    }

    await ctx.db.insert("notifications", {
      userId: profile.userId,
      type: "announcement",
      title: args.title,
      body: args.body,
      read: false,
      createdAt: now,
    });
    delivered += 1;
  }

  return delivered;
}

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    audience: v.optional(
      v.union(
        v.literal("all"),
        v.literal("paid"),
        v.literal("trial"),
        v.literal("unpaid")
      )
    ),
    /** Unix ms. If in the future, cron delivers later. */
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const title = args.title.trim();
    const body = args.body.trim();
    if (!title || !body) throw new Error("Title and message are required.");
    if (title.length > 120) throw new Error("Title is too long.");
    if (body.length > 4000) throw new Error("Message is too long.");

    const audience = args.audience ?? "all";
    const now = Date.now();
    const scheduledFor = args.scheduledFor;
    const sendNow = scheduledFor === undefined || scheduledFor <= now + 15_000;

    if (scheduledFor !== undefined && scheduledFor > now + 15_000) {
      const maxAhead = now + 90 * 24 * 60 * 60 * 1000;
      if (scheduledFor > maxAhead) {
        throw new Error("Schedule must be within 90 days.");
      }
    }

    await ctx.db.insert("announcements", {
      title,
      body,
      createdAt: now,
      createdBy: userId,
      audience,
      scheduledFor: sendNow ? undefined : scheduledFor,
      sentAt: sendNow ? now : undefined,
    });

    if (sendNow) {
      await fanOutAnnouncement(ctx, { title, body, audience });
    }

    await writeAuditLog(ctx, {
      actorUserId: userId,
      action: sendNow ? "create_announcement" : "schedule_announcement",
      metadata: {
        title,
        audience,
        scheduledFor: sendNow ? null : scheduledFor ?? null,
      },
    });

    return { scheduled: !sendNow };
  },
});

/** Deliver due scheduled announcements (cron). */
export const deliverScheduledAnnouncements = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const announcements = await ctx.db.query("announcements").collect();
    const due = announcements.filter(
      (a: Doc<"announcements">) =>
        a.sentAt === undefined &&
        a.scheduledFor !== undefined &&
        a.scheduledFor <= now
    );

    let delivered = 0;
    for (const announcement of due) {
      const audience = (announcement.audience ?? "all") as AnnouncementAudience;
      await fanOutAnnouncement(ctx, {
        title: announcement.title,
        body: announcement.body,
        audience,
      });
      await ctx.db.patch(announcement._id, { sentAt: now });
      delivered += 1;
    }

    return { delivered };
  },
});

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireAdmin(ctx, userId);

    const profiles = await ctx.db.query("profiles").collect();
    const members = profiles.filter((p) => !isStaffRole(p.role));

    const countryBreakdown: Record<string, number> = {};
    const monthlySignups: Record<string, number> = {};
    const genderBreakdown: Record<string, number> = {
      male: 0,
      female: 0,
      unknown: 0,
    };
    const reviewBreakdown: Record<string, number> = {
      incomplete: 0,
      pending_review: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
    };

    for (const p of members) {
      const country = p.country?.trim() || "Unknown";
      countryBreakdown[country] = (countryBreakdown[country] ?? 0) + 1;

      const month = new Date(p._creationTime).toISOString().slice(0, 7);
      monthlySignups[month] = (monthlySignups[month] ?? 0) + 1;

      if (p.gender === "male" || p.gender === "female") {
        genderBreakdown[p.gender] += 1;
      } else {
        genderBreakdown.unknown += 1;
      }

      const review = resolveReviewStatus(p);
      reviewBreakdown[review] = (reviewBreakdown[review] ?? 0) + 1;
    }

    const paidMembers = members.filter((p) => p.hasPaid).length;
    const memberCount = members.length;
    const completeMembers = members.filter((p) => p.questionnaireComplete).length;
    const trialMembers = members.filter(
      (p) => !p.hasPaid && isInTrialPeriod(p)
    ).length;

    return {
      countryBreakdown,
      monthlySignups,
      genderBreakdown,
      reviewBreakdown,
      trialMembers,
      paidMembers,
      memberCount,
      matchRate:
        memberCount > 0 ? Math.round((completeMembers / memberCount) * 100) : 0,
      conversionRate:
        memberCount > 0 ? Math.round((paidMembers / memberCount) * 100) : 0,
    };
  },
});

/** Owner-only: backfill profile defaults and remove deprecated legacy fields. */
export const runProfileBackfill = mutation({
  args: {},
  handler: async (ctx): Promise<{ updated: number; total: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireOwner(ctx, userId);
    const result: { updated: number; total: number } = await ctx.runMutation(
      internal.migrations.backfillProfileFields,
      {}
    );
    const profiles = await ctx.db.query("profiles").collect();
    for (const profile of profiles) {
      await ctx.scheduler.runAfter(0, internal.matchingEngine.recalculateScores, {
        userId: profile.userId,
      });
    }
    return result;
  },
});

export const getAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    await requireAdmin(ctx, userId);

    const limit = Math.min(args.limit ?? 80, 200);
    const logs = await ctx.db.query("auditLogs").order("desc").take(limit);

    return await Promise.all(
      logs.map(async (log) => {
        const actor = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", log.actorUserId))
          .unique();
        const target = log.targetUserId
          ? await ctx.db
              .query("profiles")
              .withIndex("by_userId", (q) => q.eq("userId", log.targetUserId!))
              .unique()
          : null;

        return {
          _id: log._id,
          action: log.action,
          metadata: log.metadata ?? null,
          createdAt: log.createdAt,
          actorName: actor?.name ?? "Staff",
          actorUserId: log.actorUserId,
          targetName: target?.name ?? null,
          targetUserId: log.targetUserId ?? null,
          targetProfileId: log.targetProfileId ?? null,
        };
      })
    );
  },
});
