import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hasPaidAccess, isStaffRole } from "./lib/roles";
import { isInTrialPeriod } from "./lib/trial";

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

    if (!profile.questionnaireComplete) {
      return [{ id: "complete-profile" as const, href: "/questionnaire" }];
    }

    if (isInTrialPeriod(profile) && !profile.hasPaid) {
      return [{ id: "free-trial-active" as const, href: "/matches" }];
    }

    if (!hasPaidAccess(profile)) {
      return [{ id: "complete-payment" as const, href: "/payment" }];
    }

    if (!profile.approved) {
      return [{ id: "pending-approval" as const, href: "/dashboard" }];
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
