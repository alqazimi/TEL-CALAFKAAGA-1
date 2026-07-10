import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hasPaidAccess, isStaffRole } from "./lib/roles";
import { isProfileFullyComplete } from "./lib/profileCompleteness";

export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return await Promise.all(
      notifications.map(async (n) => {
        let relatedImageUrl = null;
        if (n.relatedUserId) {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", n.relatedUserId!))
            .unique();
          if (profile?.profileImageId) {
            relatedImageUrl = await ctx.storage.getUrl(profile.profileImageId);
          }
        }
        return { ...n, relatedImageUrl };
      })
    );
  },
});

export const getMemberReminders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || isStaffRole(profile.role)) return [];

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile.questionnaireComplete || !isProfileFullyComplete(profile, preferences)) {
      return [{ id: "complete-profile" as const, href: "/questionnaire" }];
    }

    if (!hasPaidAccess(profile)) {
      return [{ id: "complete-payment" as const, href: "/payment" }];
    }

    return [];
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const notification = await ctx.db.get(args.notificationId);
    if (notification?.userId !== userId) return;

    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

const notificationType = v.union(
  v.literal("like"),
  v.literal("match"),
  v.literal("message"),
  v.literal("announcement"),
  v.literal("approval"),
  v.literal("payment")
);

export const markNotificationsRead = mutation({
  args: {
    types: v.optional(v.array(notificationType)),
    relatedUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    for (const n of unread) {
      if (args.types && !args.types.includes(n.type)) continue;
      if (args.relatedUserId && n.relatedUserId !== args.relatedUserId) continue;
      await ctx.db.patch(n._id, { read: true });
    }
  },
});
