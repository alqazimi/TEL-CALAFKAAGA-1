import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  countStaff,
  getProfileForUser,
  normalizeEmail,
  requireAdmin,
  requireOwner,
  verifyBootstrapCredentials,
} from "./lib/adminAuth";
import { isOwnerRole, isStaffRole } from "./lib/roles";
import {
  PERSONAL_SUPPORT_AMOUNT_CENTS,
} from "./payments";

function buildPaidByUserMap(
  completedPayments: { userId: string; amount: number }[]
) {
  const paidByUser = new Map<string, number>();
  for (const payment of completedPayments) {
    paidByUser.set(
      payment.userId,
      (paidByUser.get(payment.userId) ?? 0) + payment.amount
    );
  }
  return paidByUser;
}

function isPremiumMember(
  profile: { hasPersonalSupport?: boolean },
  paidCents: number
) {
  return profile.hasPersonalSupport === true || paidCents >= PERSONAL_SUPPORT_AMOUNT_CENTS;
}

function isBasicPaidMember(
  profile: { hasPaid: boolean; hasPersonalSupport?: boolean },
  paidCents: number
) {
  return profile.hasPaid && !isPremiumMember(profile, paidCents);
}

export const hasAnyAdmin = query({
  args: {},
  handler: async (ctx) => {
    return (await countStaff(ctx)) > 0;
  },
});

export const getBootstrapStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        hasAdmins: (await countStaff(ctx)) > 0,
        canClaim: false,
        reason: "not_authenticated" as const,
      };
    }

    const hasStaff = (await countStaff(ctx)) > 0;
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

    if ((await countStaff(ctx)) > 0) {
      throw new Error("An owner or admin already exists.");
    }

    const user = await ctx.db.get(userId);
    verifyBootstrapCredentials(args.secret, user?.email);

    const profile = await getProfileForUser(ctx, userId);
    if (!profile) throw new Error("Profile not found.");

    await ctx.db.patch(profile._id, { role: "owner", hasPaid: true });
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

    if (targetProfile.role === args.role) return;

    await ctx.db.patch(args.profileId, { role: args.role });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const caller = await getProfileForUser(ctx, userId);
    if (!caller || !isStaffRole(caller.role)) return null;

    const profiles = await ctx.db.query("profiles").collect();
    const matches = await ctx.db.query("matches").collect();
    const messages = await ctx.db.query("messages").collect();
    const payments = await ctx.db.query("payments").collect();

    const completedPayments = payments.filter((p) => p.status === "completed");
    const revenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidByUser = buildPaidByUserMap(completedPayments);
    const members = profiles.filter((p) => !isStaffRole(p.role));

    const paidBasicCount = members.filter((p) =>
      isBasicPaidMember(p, paidByUser.get(p.userId) ?? 0)
    ).length;
    const paidPremiumCount = members.filter((p) =>
      isPremiumMember(p, paidByUser.get(p.userId) ?? 0)
    ).length;
    const unpaidCount = members.filter((p) => !p.hasPaid).length;

    return {
      totalUsers: profiles.length,
      maleUsers: profiles.filter((p) => p.gender === "male").length,
      femaleUsers: profiles.filter((p) => p.gender === "female").length,
      totalMatches: matches.filter((m) => m.status === "active").length,
      totalMessages: messages.length,
      revenue,
      paidBasicCount,
      paidPremiumCount,
      unpaidCount,
      pendingApproval: profiles.filter((p) => !p.approved).length,
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    await requireAdmin(ctx, userId);

    let profiles = await ctx.db.query("profiles").collect();

    const completedPayments = (await ctx.db.query("payments").collect()).filter(
      (p) => p.status === "completed"
    );
    const paidByUser = buildPaidByUserMap(completedPayments);

    const userCache = new Map<string, { email?: string } | null>();
    for (const profile of profiles) {
      if (!userCache.has(profile.userId)) {
        userCache.set(profile.userId, await ctx.db.get(profile.userId));
      }
    }

    if (args.search) {
      const search = args.search.toLowerCase();
      profiles = profiles.filter((p) => {
        const email = userCache.get(p.userId)?.email?.toLowerCase() ?? "";
        return (
          p.name.toLowerCase().includes(search) ||
          p.country.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search) ||
          email.includes(search) ||
          (p.phone ?? "").toLowerCase().includes(search)
        );
      });
    }

    if (args.role && args.role !== "all") {
      profiles = profiles.filter((p) => p.role === args.role);
    }

    if (args.payment && args.payment !== "all") {
      profiles = profiles.filter((p) => {
        if (isStaffRole(p.role)) return false;

        const cents = paidByUser.get(p.userId) ?? 0;
        switch (args.payment) {
          case "unpaid":
            return !p.hasPaid;
          case "paid":
            return p.hasPaid;
          case "premium":
            return isPremiumMember(p, cents);
          case "basic":
            return isBasicPaidMember(p, cents);
          default:
            return true;
        }
      });
    }

    return await Promise.all(
      profiles.map(async (p) => {
        let imageUrl = null;
        if (p.profileImageId) {
          imageUrl = await ctx.storage.getUrl(p.profileImageId);
        }
        const user = userCache.get(p.userId);
        const paidCents = paidByUser.get(p.userId) ?? 0;
        return {
          ...p,
          imageUrl,
          paidCents,
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

    const payments = await ctx.db.query("payments").collect();
    payments.sort((a, b) => b.createdAt - a.createdAt);

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

export const approveUser = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);
    await ctx.db.patch(args.profileId, { approved: true });
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

    await ctx.db.patch(args.profileId, { banned: args.banned });
  },
});

export const deleteUser = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) return;

    if (isStaffRole(profile.role)) {
      throw new Error("Cannot delete an admin or owner account. Remove their role first.");
    }

    const targetUserId = profile.userId;

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .unique();
    if (preferences) {
      await ctx.db.delete(preferences._id);
    }

    const likesFrom = await ctx.db
      .query("likes")
      .withIndex("by_from", (q) => q.eq("fromUserId", targetUserId))
      .collect();
    const likesTo = await ctx.db
      .query("likes")
      .withIndex("by_to", (q) => q.eq("toUserId", targetUserId))
      .collect();
    for (const like of [...likesFrom, ...likesTo]) {
      await ctx.db.delete(like._id);
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    const scoresA = await ctx.db
      .query("compatibilityScores")
      .withIndex("by_userA", (q) => q.eq("userA", targetUserId))
      .collect();
    const scoresB = await ctx.db
      .query("compatibilityScores")
      .withIndex("by_userB", (q) => q.eq("userB", targetUserId))
      .collect();
    for (const score of [...scoresA, ...scoresB]) {
      await ctx.db.delete(score._id);
    }

    const uploads = await ctx.db
      .query("userUploads")
      .filter((q) => q.eq(q.field("userId"), targetUserId))
      .collect();
    for (const upload of uploads) {
      await ctx.db.delete(upload._id);
    }

    await ctx.db.delete(args.profileId);
  },
});

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    await ctx.db.insert("announcements", {
      title: args.title,
      body: args.body,
      createdAt: Date.now(),
      createdBy: userId,
    });

    const profiles = await ctx.db.query("profiles").collect();
    for (const profile of profiles) {
      await ctx.db.insert("notifications", {
        userId: profile.userId,
        type: "announcement",
        title: args.title,
        body: args.body,
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireAdmin(ctx, userId);

    const profiles = await ctx.db.query("profiles").collect();
    const matches = await ctx.db.query("matches").collect();
    const payments = await ctx.db.query("payments").collect();

    const countryBreakdown: Record<string, number> = {};
    for (const p of profiles) {
      countryBreakdown[p.country] = (countryBreakdown[p.country] ?? 0) + 1;
    }

    const monthlySignups: Record<string, number> = {};
    for (const p of profiles) {
      const month = new Date().toISOString().slice(0, 7);
      monthlySignups[month] = (monthlySignups[month] ?? 0) + 1;
    }

    return {
      countryBreakdown,
      monthlySignups,
      matchRate:
        profiles.length > 0
          ? Math.round(
              (matches.filter((m) => m.status === "active").length / profiles.length) * 100
            )
          : 0,
      conversionRate:
        profiles.length > 0
          ? Math.round(
              (payments.filter((p) => p.status === "completed").length / profiles.length) * 100
            )
          : 0,
    };
  },
});
