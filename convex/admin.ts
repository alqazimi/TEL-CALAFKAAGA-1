import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

async function requireAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return profile;
}

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireAdmin(ctx, userId);

    const profiles = await ctx.db.query("profiles").collect();
    const matches = await ctx.db.query("matches").collect();
    const messages = await ctx.db.query("messages").collect();
    const payments = await ctx.db
      .query("payments")
      .collect();

    const completedPayments = payments.filter((p) => p.status === "completed");
    const revenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalUsers: profiles.length,
      maleUsers: profiles.filter((p) => p.gender === "male").length,
      femaleUsers: profiles.filter((p) => p.gender === "female").length,
      totalMatches: matches.filter((m) => m.status === "active").length,
      totalMessages: messages.length,
      revenue,
      pendingApproval: profiles.filter((p) => !p.approved).length,
      bannedUsers: profiles.filter((p) => p.banned).length,
    };
  },
});

export const getAllUsers = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    await requireAdmin(ctx, userId);

    let profiles = await ctx.db.query("profiles").collect();

    if (args.search) {
      const search = args.search.toLowerCase();
      profiles = profiles.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.country.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search)
      );
    }

    return await Promise.all(
      profiles.map(async (p) => {
        let imageUrl = null;
        if (p.profileImageId) {
          imageUrl = await ctx.storage.getUrl(p.profileImageId);
        }
        return { ...p, imageUrl };
      })
    );
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
    await ctx.db.patch(args.profileId, { banned: args.banned });
  },
});

export const deleteUser = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);
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
              (matches.filter((m) => m.status === "active").length /
                profiles.length) *
                100
            )
          : 0,
      conversionRate:
        profiles.length > 0
          ? Math.round(
              (payments.filter((p) => p.status === "completed").length /
                profiles.length) *
                100
            )
          : 0,
    };
  },
});
