import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireActiveProfile, requireAuthUserId } from "./lib/access";
import { hasPaidAccess } from "./lib/roles";
import { isProfileFullyComplete } from "./lib/profileCompleteness";
import { getBlockedUserIds, isEitherBlocked } from "./lib/moderation";
import {
  buildMatchResult,
  getActiveMatchPartnerIds,
  type MatchFilterArgs,
  profilePassesMatchFilters,
} from "./lib/matchPresentation";
import { sendNotification } from "./lib/sendNotification";
import { isPremiumMember } from "./lib/premium";
import { calculateCompatibilityBreakdown } from "./matching";
import {
  MATCH_DISCOVER_LIMIT,
  MATCH_LIST_LIMIT,
  MIN_COMPATIBILITY_SCORE,
} from "./lib/constants";

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

  const preferences = await ctx.db
    .query("preferences")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!isProfileFullyComplete(myProfile, preferences)) return null;

  return { userId, myProfile };
}

async function buildScoreMap(ctx: QueryCtx, userId: Id<"users">) {
  const scores = await ctx.db
    .query("compatibilityScores")
    .withIndex("by_userA", (q) => q.eq("userA", userId))
    .collect();
  return new Map(scores.map((s) => [s.userB, s.score]));
}

type LoadProfileOptions = {
  scoreMap?: Map<Id<"users">, number>;
  /** Skip extra gallery URLs — faster for cards and lists. */
  listPreview?: boolean;
  maxResults?: number;
};

async function loadProfilesForUserIds(
  ctx: QueryCtx,
  userIds: Id<"users">[],
  myProfile: Doc<"profiles">,
  args: MatchFilterArgs,
  myLikes: Doc<"likes">[],
  blockedIds: Set<Id<"users">>,
  options?: LoadProfileOptions
) {
  const ids = options?.maxResults ? userIds.slice(0, options.maxResults) : userIds;
  const scoreMap =
    options?.scoreMap ?? (await buildScoreMap(ctx, myProfile.userId));
  const includeGallery = !options?.listPreview;

  const results = await Promise.all(
    ids.map(async (targetUserId) => {
      if (blockedIds.has(targetUserId)) return null;

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
        .unique();

      if (!profile || profile.banned || !profile.questionnaireComplete) return null;
      if (!profile.profileImageId) return null;
      if (!profilePassesMatchFilters(profile, args)) return null;

      const score = scoreMap.get(targetUserId) ?? 0;
      const interaction = myLikes.find((l) => l.toUserId === targetUserId);

      return buildMatchResult(
        ctx,
        profile,
        targetUserId,
        score,
        interaction,
        { includeGallery }
      );
    })
  );

  return results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.score - a.score);
}

function pickListResults<T extends { userId: Id<"users"> }>(
  orderedIds: Id<"users">[],
  results: T[]
) {
  const byId = new Map(results.map((r) => [r.userId, r]));
  return orderedIds
    .map((id) => byId.get(id))
    .filter((r): r is T => r !== undefined);
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
    const scoreMap = new Map(scores.map((s) => [s.userB, s.score]));

    const discoverIds = scores
      .filter(
        (s) => s.score >= MIN_COMPATIBILITY_SCORE && !interactedIds.has(s.userB)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, MATCH_DISCOVER_LIMIT)
      .map((s) => s.userB);

    return loadProfilesForUserIds(
      ctx,
      discoverIds,
      myProfile,
      args,
      myLikes,
      blockedIds,
      { scoreMap, listPreview: true }
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
    const scoreMap = await buildScoreMap(ctx, userId);

    return loadProfilesForUserIds(
      ctx,
      shortlistIds,
      myProfile,
      args,
      myLikes,
      blockedIds,
      { scoreMap, listPreview: true, maxResults: MATCH_LIST_LIMIT }
    );
  },
});

export const getPassedProfiles = query({
  args: matchFilterArgs,
  handler: async (ctx, args) => {
    const access = await getMatchAccessProfile(ctx);
    if (!access) return [];

    const { userId, myProfile } = access;
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("by_from", (q) => q.eq("fromUserId", userId))
      .collect();

    const passedIds = myLikes
      .filter((l) => l.action === "pass")
      .map((l) => l.toUserId);

    const blockedIds = await getBlockedUserIds(ctx, userId);
    const scoreMap = await buildScoreMap(ctx, userId);

    return loadProfilesForUserIds(
      ctx,
      passedIds,
      myProfile,
      args,
      myLikes,
      blockedIds,
      { scoreMap, listPreview: true, maxResults: MATCH_LIST_LIMIT }
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

    const activePartners = await getActiveMatchPartnerIds(ctx, userId);
    const likedIds = myLikes
      .filter((l) => l.action === "like" && !activePartners.has(l.toUserId))
      .map((l) => l.toUserId);

    const blockedIds = await getBlockedUserIds(ctx, userId);
    const scoreMap = await buildScoreMap(ctx, userId);

    return loadProfilesForUserIds(
      ctx,
      likedIds,
      myProfile,
      args,
      myLikes,
      blockedIds,
      { scoreMap, listPreview: true, maxResults: MATCH_LIST_LIMIT }
    );
  },
});

export const getReceivedLikes = query({
  args: matchFilterArgs,
  handler: async (ctx, args) => {
    const access = await getMatchAccessProfile(ctx);
    if (!access) return [];

    const { userId, myProfile } = access;
    if (!isPremiumMember(myProfile)) {
      return [];
    }

    const incomingLikes = await ctx.db
      .query("likes")
      .withIndex("by_to", (q) => q.eq("toUserId", userId))
      .collect();

    const activePartners = await getActiveMatchPartnerIds(ctx, userId);
    const receivedIds = incomingLikes
      .filter((l) => l.action === "like" && !activePartners.has(l.fromUserId))
      .map((l) => l.fromUserId);

    const myLikes = await ctx.db
      .query("likes")
      .withIndex("by_from", (q) => q.eq("fromUserId", userId))
      .collect();

    const blockedIds = await getBlockedUserIds(ctx, userId);
    const scoreMap = await buildScoreMap(ctx, userId);

    return loadProfilesForUserIds(
      ctx,
      receivedIds,
      myProfile,
      args,
      myLikes,
      blockedIds,
      { scoreMap, listPreview: true, maxResults: MATCH_LIST_LIMIT }
    );
  },
});

/** All Likes-tab lists in one query (fewer subscriptions, shared reads). */
export const getMatchLists = query({
  args: matchFilterArgs,
  handler: async (ctx, args) => {
    const empty = {
      shortlist: [] as Awaited<ReturnType<typeof loadProfilesForUserIds>>,
      liked: [] as Awaited<ReturnType<typeof loadProfilesForUserIds>>,
      passed: [] as Awaited<ReturnType<typeof loadProfilesForUserIds>>,
      likedYou: [] as Awaited<ReturnType<typeof loadProfilesForUserIds>>,
    };

    const access = await getMatchAccessProfile(ctx);
    if (!access) return empty;

    const { userId, myProfile } = access;
    const [myLikes, incomingLikes, blockedIds, scoreMap, activePartners] =
      await Promise.all([
        ctx.db
          .query("likes")
          .withIndex("by_from", (q) => q.eq("fromUserId", userId))
          .collect(),
        ctx.db
          .query("likes")
          .withIndex("by_to", (q) => q.eq("toUserId", userId))
          .collect(),
        getBlockedUserIds(ctx, userId),
        buildScoreMap(ctx, userId),
        getActiveMatchPartnerIds(ctx, userId),
      ]);

    const shortlistIds = myLikes
      .filter((l) => l.action === "shortlist")
      .slice(0, MATCH_LIST_LIMIT)
      .map((l) => l.toUserId);
    const likedIds = myLikes
      .filter((l) => l.action === "like" && !activePartners.has(l.toUserId))
      .slice(0, MATCH_LIST_LIMIT)
      .map((l) => l.toUserId);
    const passedIds = myLikes
      .filter((l) => l.action === "pass")
      .slice(0, MATCH_LIST_LIMIT)
      .map((l) => l.toUserId);
    const likedYouIds =
      isPremiumMember(myProfile)
        ? incomingLikes
            .filter((l) => l.action === "like" && !activePartners.has(l.fromUserId))
            .slice(0, MATCH_LIST_LIMIT)
            .map((l) => l.fromUserId)
        : [];

    const uniqueIds = [
      ...new Set([...shortlistIds, ...likedIds, ...passedIds, ...likedYouIds]),
    ];

    const loaded = await loadProfilesForUserIds(
      ctx,
      uniqueIds,
      myProfile,
      args,
      myLikes,
      blockedIds,
      { scoreMap, listPreview: true }
    );

    return {
      shortlist: pickListResults(shortlistIds, loaded),
      liked: pickListResults(likedIds, loaded),
      passed: pickListResults(passedIds, loaded),
      likedYou: pickListResults(likedYouIds, loaded),
    };
  },
});

export const getCompatibilityBreakdown = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const access = await getMatchAccessProfile(ctx);
    if (!access) return null;
    if (!isPremiumMember(access.myProfile)) return null;

    const candidate = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();

    if (!candidate || candidate.banned || !candidate.questionnaireComplete) return null;

    const myPrefs = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", access.userId))
      .unique();

    const candidatePrefs = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();

    if (!myPrefs || !candidatePrefs) return null;

    return calculateCompatibilityBreakdown(
      access.myProfile,
      myPrefs,
      candidate,
      candidatePrefs
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

    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!isProfileFullyComplete(myProfile, preferences)) {
      throw new Error(
        "Finish all profile questions, phone number, and photo before liking members"
      );
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
