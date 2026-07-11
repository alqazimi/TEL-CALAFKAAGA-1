import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isStaffRole } from "./lib/roles";
import { resolveReviewStatus, requiresAdminProfileApproval } from "./lib/reviewStatus";

const EMPTY_METRICS = {
  totalUsers: 0,
  maleUsers: 0,
  femaleUsers: 0,
  approvedMale: 0,
  approvedFemale: 0,
  approvedTotal: 0,
  paidBasicMembers: 0,
  freeBasicWomen: 0,
  paidPremiumCount: 0,
  unpaidCount: 0,
  trialCount: 0,
  pendingApproval: 0,
  bannedUsers: 0,
  paidMembers: 0,
  memberCount: 0,
  completeMembers: 0,
  trialMembers: 0,
  genderBreakdown: { male: 0, female: 0, unknown: 0 },
  reviewBreakdown: {
    incomplete: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  },
  countryBreakdown: {} as Record<string, number>,
  monthlySignups: {} as Record<string, number>,
};

type Acc = typeof EMPTY_METRICS;

function emptyAcc(): Acc {
  return {
    ...EMPTY_METRICS,
    genderBreakdown: { ...EMPTY_METRICS.genderBreakdown },
    reviewBreakdown: { ...EMPTY_METRICS.reviewBreakdown },
    countryBreakdown: {},
    monthlySignups: {},
  };
}

function foldProfile(acc: Acc, p: Doc<"profiles">) {
  acc.totalUsers += 1;
  if (p.banned) acc.bannedUsers += 1;

  if (p.gender === "male") acc.maleUsers += 1;
  else if (p.gender === "female") acc.femaleUsers += 1;

  if (isStaffRole(p.role)) return;

  acc.memberCount += 1;
  if (p.hasPaid) acc.paidMembers += 1;
  if (p.questionnaireComplete) acc.completeMembers += 1;

  if (p.gender === "male" || p.gender === "female") {
    acc.genderBreakdown[p.gender] += 1;
  } else {
    acc.genderBreakdown.unknown += 1;
  }

  const review = resolveReviewStatus(p);
  if (review in acc.reviewBreakdown) {
    acc.reviewBreakdown[review as keyof Acc["reviewBreakdown"]] += 1;
  }

  if (review === "approved") {
    acc.approvedTotal += 1;
    if (p.gender === "male") acc.approvedMale += 1;
    if (p.gender === "female") acc.approvedFemale += 1;
  }

  if (p.hasPaid && !p.hasPersonalSupport && p.gender === "male") {
    acc.paidBasicMembers += 1;
  }
  if (p.gender === "female" && p.hasPaid && !p.hasPersonalSupport) {
    acc.freeBasicWomen += 1;
  }
  if (p.hasPersonalSupport) acc.paidPremiumCount += 1;
  if (p.gender === "male" && !p.hasPaid) acc.unpaidCount += 1;

  if (requiresAdminProfileApproval(p)) {
    if (review === "pending_review" || review === "rejected") {
      acc.pendingApproval += 1;
    }
  }

  const country = p.country?.trim() || "Unknown";
  acc.countryBreakdown[country] = (acc.countryBreakdown[country] ?? 0) + 1;

  const month = new Date(p._creationTime).toISOString().slice(0, 7);
  acc.monthlySignups[month] = (acc.monthlySignups[month] ?? 0) + 1;
}

export async function getSiteMetrics(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("siteMetrics")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .unique();
}

/** Schedule a background rebuild (deduped within 2 minutes). */
export async function scheduleSiteMetricsRebuild(ctx: MutationCtx) {
  const existing = await getSiteMetrics(ctx);
  const now = Date.now();
  if (existing?.rebuildScheduledAt && now - existing.rebuildScheduledAt < 2 * 60 * 1000) {
    return;
  }

  if (existing) {
    await ctx.db.patch(existing._id, { rebuildScheduledAt: now });
  } else {
    await ctx.db.insert("siteMetrics", {
      key: "global",
      ...emptyAcc(),
      updatedAt: 0,
      rebuildScheduledAt: now,
    });
  }

  await ctx.scheduler.runAfter(0, internal.siteMetrics.rebuildFromStart, {});
}

const accValidator = v.object({
  totalUsers: v.number(),
  maleUsers: v.number(),
  femaleUsers: v.number(),
  approvedMale: v.number(),
  approvedFemale: v.number(),
  approvedTotal: v.number(),
  paidBasicMembers: v.number(),
  freeBasicWomen: v.number(),
  paidPremiumCount: v.number(),
  unpaidCount: v.number(),
  trialCount: v.number(),
  pendingApproval: v.number(),
  bannedUsers: v.number(),
  paidMembers: v.number(),
  memberCount: v.number(),
  completeMembers: v.number(),
  trialMembers: v.number(),
  genderBreakdown: v.object({
    male: v.number(),
    female: v.number(),
    unknown: v.number(),
  }),
  reviewBreakdown: v.object({
    incomplete: v.number(),
    pending_review: v.number(),
    approved: v.number(),
    rejected: v.number(),
    suspended: v.number(),
  }),
  countryBreakdown: v.record(v.string(), v.number()),
  monthlySignups: v.record(v.string(), v.number()),
});

export const rebuildFromStart = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.siteMetrics.rebuildPage, {
      cursor: null,
      acc: emptyAcc(),
    });
  },
});

export const rebuildPage = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    acc: accValidator,
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("profiles").paginate({
      numItems: 100,
      cursor: args.cursor,
    });

    const acc = {
      ...args.acc,
      genderBreakdown: { ...args.acc.genderBreakdown },
      reviewBreakdown: { ...args.acc.reviewBreakdown },
      countryBreakdown: { ...args.acc.countryBreakdown },
      monthlySignups: { ...args.acc.monthlySignups },
    };

    for (const profile of page.page) {
      foldProfile(acc, profile);
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.siteMetrics.rebuildPage, {
        cursor: page.continueCursor,
        acc,
      });
      return;
    }

    const existing = await getSiteMetrics(ctx);
    const payload = {
      key: "global" as const,
      ...acc,
      // Trial access removed — keep field for admin UI compatibility.
      trialCount: 0,
      trialMembers: 0,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.replace(existing._id, payload);
    } else {
      await ctx.db.insert("siteMetrics", payload);
    }
  },
});

/** Cron entrypoint. */
export const rebuildCron = internalMutation({
  args: {},
  handler: async (ctx) => {
    await scheduleSiteMetricsRebuild(ctx);
  },
});
