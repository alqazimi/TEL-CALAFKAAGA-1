import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireActiveProfile, requireAuthUserId } from "./lib/access";
import { hasPaidAccess, isStaffRole } from "./lib/roles";
import { getBlockedUserIds, isEitherBlocked } from "./lib/moderation";
import {
  buildMatchResult,
  hasActiveMatch,
  type MatchFilterArgs,
  profilePassesMatchFilters,
} from "./lib/matchPresentation";
import { sendNotification } from "./lib/sendNotification";

const matchFilterArgs = {
  country: v.optional(v.string()),
  city: v.optional(v.string()),
  minAge: v.optional(v.number()),
  maxAge: v.optional(v.number()),
  minHeight: v.optional(v.number()),
  maxHeight: v.optional(v.number()),
  religiousLevel: v.optional(v.string()),
  education: v.optional(v.string()),
  occupation: v.optional(v.string()),
  children: v.optional(v.number()),
  maritalStatus: v.optional(v.string()),
  marriageTimeline: v.optional(v.string()),
};

async function getMatchAccessProfile(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const myProfile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (!myProfile?.questionnaireComplete) return null;
  if (!hasPaidAccess(myProfile)) return null;
  if (!isStaffRole(myProfile.role) && !myProfile.approved) return null;

  return { userId, myProfile };
}

async function loadProfilesForUserIds(
  ctx: QueryCtx,
  userIds: Id<"users">[],
  myProfile: Doc<"profiles">,
  args: MatchFilterArgs,
  myLikes: Doc<"likes">[],
  blockedIds: Set<Id<"users">>
) {
  const scoreMap = new Map(
    (
      await ctx.db
        .query("compatibilityScores")
        .withIndex("by_userA", (q) => q.eq("userA", myProfile.userId))
        .collect()
    ).map((s) => [s.userB, s.score])
  );

  const results = await Promise.all(
    userIds.map(async (targetUserId) => {
      if (blockedIds.has(targetUserId)) return null;

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
        .unique();

      if (!profile || profile.banned || !profile.approved) return null;
      if (profile.gender === myProfile.gender) return null;
      if (!profile.profileImageId) return null;
      if (!profilePassesMatchFilters(profile, args)) return null;

      const score = scoreMap.get(targetUserId) ?? 0;
      const interaction = myLikes.find((l) => l.toUserId === targetUserId);

      return buildMatchResult(ctx, profile, targetUserId, score, interaction);
    })
  );

  return results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.score - a.score);
}

export const getMatches = query({
  args: matchFilterArgs,
  handler: async (ctx, args) => {
    const access = await getMatchAccessProfile(ctx);
    if (!access) return [];

    const { userId, myProfile } = access;
    const scores = await ctx.db
      .query("compatibilityScores")
      .withIndex("by_userA", (q) => q.eq("userA", userId))
      .collect();

    const myLikes = await ctx.db
      .query("likes")
      .withIndex("by_from", (q) => q.eq("fromUserId", userId))
      .collect();

    const interactedIds = new Set(myLikes.map((l) => l.toUserId));
    const blockedIds = await getBlockedUserIds(ctx, userId);

    const discoverIds = scores
      .filter((s) => s.score >= 70 && !interactedIds.has(s.userB))
      .map((s) => s.userB);

    return loadProfilesForUserIds(
      ctx,
      discoverIds,
      myProfile,
      args,
      myLikes,
      blockedIds
    );
  },
});

export const getShortlistedProfiles = query({
  args: matchFilterArgs,
  handler: async (ctx, args) => {
    const access = await getMatchAccessProfile(ctx);
    if (!access) return [];

    const { userId, myProfile } = access;
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("by_from", (q) => q.eq("fromUserId", userId))
      .collect();

    const shortlistIds = myLikes
      .filter((l) => l.action === "shortlist")
      .map((l) => l.toUserId);

    const blockedIds = await getBlockedUserIds(ctx, userId);

    return loadProfilesForUserIds(
      ctx,
      shortlistIds,
      myProfile,
      args,
      myLikes,
      blockedIds
    );
  },
});

export const getSentLikes = query({
  args: matchFilterArgs,
  handler: async (ctx, args) => {
    const access = await getMatchAccessProfile(ctx);
    if (!access) return [];

    const { userId, myProfile } = access;
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("by_from", (q) => q.eq("fromUserId", userId))
      .collect();

    const likedIds: Id<"users">[] = [];
    for (const like of myLikes.filter((l) => l.action === "like")) {
      if (!(await hasActiveMatch(ctx, userId, like.toUserId))) {
        likedIds.push(like.toUserId);
      }
    }

    const blockedIds = await getBlockedUserIds(ctx, userId);

    return loadProfilesForUserIds(
      ctx,
      likedIds,
      myProfile,
      args,
      myLikes,
      blockedIds
    );
  },
});

export const likeUser = mutation({
  args: {
    toUserId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("pass"), v.literal("shortlist")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const myProfile = await requireActiveProfile(ctx, userId);

    if (!myProfile.questionnaireComplete) {
      throw new Error("Complete your questionnaire first");
    }
    if (!hasPaidAccess(myProfile)) {
      throw new Error("Complete payment to like profiles");
    }
    if (!isStaffRole(myProfile.role) && !myProfile.approved) {
      throw new Error("Your profile is pending admin approval");
    }

    if (await isEitherBlocked(ctx, userId, args.toUserId)) {
      throw new Error("You cannot interact with this user");
    }

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) =>
        q.eq("fromUserId", userId).eq("toUserId", args.toUserId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { action: args.action });
    } else {
      await ctx.db.insert("likes", {
        fromUserId: userId,
        toUserId: args.toUserId,
        action: args.action,
      });
    }

    if (args.action === "shortlist" || args.action === "pass") {
      return { matched: false };
    }

    const reverseLike = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) =>
        q.eq("fromUserId", args.toUserId).eq("toUserId", userId)
      )
      .unique();

    await sendNotification(ctx, {
      userId: args.toUserId,
      type: "like",
      title: "Someone liked you!",
      body: `${myProfile.name} liked your profile.`,
      relatedUserId: userId,
      sendEmail: true,
    });

    if (reverseLike?.action === "like") {
      const score = await ctx.db
        .query("compatibilityScores")
        .withIndex("by_pair", (q) =>
          q.eq("userA", userId).eq("userB", args.toUserId)
        )
        .unique();

      const matchId = await ctx.db.insert("matches", {
        userA: userId,
        userB: args.toUserId,
        score: score?.score ?? 0,
        status: "active",
        chatUnlocked: false,
      });

      const convId = await ctx.db.insert("conversations", {
        matchId,
        participants: [userId, args.toUserId],
        lastMessageAt: Date.now(),
      });

      const otherProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", args.toUserId))
        .unique();

      for (const uid of [userId, args.toUserId]) {
        await sendNotification(ctx, {
          userId: uid,
          type: "match",
          title: "New Match!",
          body: `You matched with ${uid === userId ? otherProfile?.name : myProfile.name}!`,
          relatedUserId: uid === userId ? args.toUserId : userId,
          sendEmail: true,
        });
      }

      return { matched: true, matchId, conversationId: convId };
    }

    return { matched: false };
  },
});

export const getMyMatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const matchesA = await ctx.db
      .query("matches")
      .withIndex("by_userA", (q) => q.eq("userA", userId))
      .collect();

    const matchesB = await ctx.db
      .query("matches")
      .withIndex("by_userB", (q) => q.eq("userB", userId))
      .collect();

    const allMatches = [...matchesA, ...matchesB].filter(
      (m) => m.status === "active"
    );
    const blockedIds = await getBlockedUserIds(ctx, userId);

    return (
      await Promise.all(
        allMatches.map(async (m) => {
          const otherId = m.userA === userId ? m.userB : m.userA;
          if (blockedIds.has(otherId)) return null;

          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", otherId))
            .unique();

          let imageUrl = null;
          if (profile?.profileImageId) {
            imageUrl = await ctx.storage.getUrl(profile.profileImageId);
          }

          const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_match", (q) => q.eq("matchId", m._id))
            .unique();

          return {
            matchId: m._id,
            conversationId: conversation?._id,
            score: m.score,
            chatUnlocked: m.chatUnlocked,
            profile: profile
              ? { ...profile, imageUrl, userId: otherId }
              : null,
          };
        })
      )
    ).filter((m): m is NonNullable<typeof m> => m !== null);
  },
});
