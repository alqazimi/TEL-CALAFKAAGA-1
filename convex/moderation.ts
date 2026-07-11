import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireActiveProfile, requireAuthUserId } from "./lib/access";
import { requireAdmin } from "./lib/adminAuth";
import { isStaffRole } from "./lib/roles";
import {
  REPORT_REASONS,
  getBlockedUserIds,
  unmatchBetweenUsers,
} from "./lib/moderation";
import { writeAuditLog } from "./lib/auditLog";

const reportReasonValidator = v.union(
  v.literal("fake_profile"),
  v.literal("inappropriate"),
  v.literal("harassment"),
  v.literal("spam"),
  v.literal("other")
);

export const blockUser = mutation({
  args: { blockedUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    if (args.blockedUserId === userId) {
      throw new Error("You cannot block yourself");
    }

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.blockedUserId))
      .unique();
    if (!targetProfile) throw new Error("User not found");
    if (isStaffRole(targetProfile.role)) {
      throw new Error("You cannot block staff accounts");
    }

    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", userId).eq("blockedId", args.blockedUserId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("blocks", {
        blockerId: userId,
        blockedId: args.blockedUserId,
        createdAt: Date.now(),
      });
    }

    await unmatchBetweenUsers(ctx, userId, args.blockedUserId);

    // Also record a pass so they stop appearing in discovery.
    const like = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) =>
        q.eq("fromUserId", userId).eq("toUserId", args.blockedUserId)
      )
      .unique();
    if (like) {
      await ctx.db.patch(like._id, { action: "pass" });
    } else {
      await ctx.db.insert("likes", {
        fromUserId: userId,
        toUserId: args.blockedUserId,
        action: "pass",
      });
    }

    return { blocked: true };
  },
});

export const unblockUser = mutation({
  args: { blockedUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", userId).eq("blockedId", args.blockedUserId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { unblocked: true };
  },
});

export const reportUser = mutation({
  args: {
    reportedUserId: v.id("users"),
    reason: reportReasonValidator,
    details: v.optional(v.string()),
    alsoBlock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    if (args.reportedUserId === userId) {
      throw new Error("You cannot report yourself");
    }
    if (!REPORT_REASONS.includes(args.reason)) {
      throw new Error("Invalid report reason");
    }

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.reportedUserId))
      .unique();
    if (!targetProfile) throw new Error("User not found");

    const recent = await ctx.db
      .query("reports")
      .withIndex("by_pair", (q) =>
        q.eq("reporterId", userId).eq("reportedUserId", args.reportedUserId)
      )
      .collect();
    const openReport = recent.find((r) => r.status === "open");
    if (openReport) {
      throw new Error("You already reported this user");
    }

    const details = args.details?.trim();
    await ctx.db.insert("reports", {
      reporterId: userId,
      reportedUserId: args.reportedUserId,
      reason: args.reason,
      details: details ? details.slice(0, 500) : undefined,
      status: "open",
      createdAt: Date.now(),
    });

    if (args.alsoBlock) {
      const existing = await ctx.db
        .query("blocks")
        .withIndex("by_pair", (q) =>
          q.eq("blockerId", userId).eq("blockedId", args.reportedUserId)
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("blocks", {
          blockerId: userId,
          blockedId: args.reportedUserId,
          createdAt: Date.now(),
        });
      }
      await unmatchBetweenUsers(ctx, userId, args.reportedUserId);
    }

    return { reported: true };
  },
});

export const listMyBlocks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
      .collect();

    return await Promise.all(
      blocks.map(async (block) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", block.blockedId))
          .unique();
        return {
          blockedUserId: block.blockedId,
          name: profile?.name ?? "User",
          createdAt: block.createdAt,
        };
      })
    );
  },
});

export const listReports = query({
  args: {
    status: v.optional(
      v.union(v.literal("open"), v.literal("reviewed"), v.literal("dismissed"))
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    await requireAdmin(ctx, userId);

    const reports = args.status
      ? await ctx.db
          .query("reports")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(100)
      : await ctx.db.query("reports").order("desc").take(100);

    return await Promise.all(
      reports.map(async (report) => {
        const reported = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", report.reportedUserId))
          .unique();
        const reporter = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", report.reporterId))
          .unique();

        return {
          _id: report._id,
          reason: report.reason,
          details: report.details ?? "",
          status: report.status,
          priority: report.priority ?? "medium",
          adminNotes: report.adminNotes ?? "",
          resolution: report.resolution ?? "",
          createdAt: report.createdAt,
          reviewedAt: report.reviewedAt,
          reportedUserId: report.reportedUserId,
          reportedName: reported?.name ?? "Unknown",
          reportedProfileId: reported?._id ?? null,
          reportedBanned: reported?.banned ?? false,
          reporterName: reporter?.name ?? "Unknown",
        };
      })
    );
  },
});

export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(v.literal("reviewed"), v.literal("dismissed")),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    adminNotes: v.optional(v.string()),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireAdmin(ctx, userId);

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedAt: Date.now(),
      reviewedBy: userId,
      ...(args.priority !== undefined ? { priority: args.priority } : {}),
      ...(args.adminNotes !== undefined
        ? { adminNotes: args.adminNotes.trim().slice(0, 2000) }
        : {}),
      ...(args.resolution !== undefined
        ? { resolution: args.resolution.trim().slice(0, 1000) }
        : {}),
    });

    await writeAuditLog(ctx, {
      actorUserId: userId,
      action: "update_report",
      targetUserId: report.reportedUserId,
      metadata: {
        reportId: args.reportId,
        status: args.status,
        priority: args.priority,
      },
    });

    return { updated: true };
  },
});

export { getBlockedUserIds };
