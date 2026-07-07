import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireActiveProfile, requireAuthUserId } from "./lib/access";
import { hasPaidAccess, isStaffRole } from "./lib/roles";
import { effectiveReligiousLevel } from "./lib/profileEnrichment";

export const getMatches = query({
  args: {
    country: v.optional(v.string()),
    minAge: v.optional(v.number()),
    maxAge: v.optional(v.number()),
    minHeight: v.optional(v.number()),
    maxHeight: v.optional(v.number()),
    religiousLevel: v.optional(v.string()),
    education: v.optional(v.string()),
    occupation: v.optional(v.string()),
    children: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!myProfile?.questionnaireComplete) return [];
    if (!hasPaidAccess(myProfile)) return [];
    if (!isStaffRole(myProfile.role) && !myProfile.approved) return [];

    const scores = await ctx.db
      .query("compatibilityScores")
      .withIndex("by_userA", (q) => q.eq("userA", userId))
      .collect();

    const myLikes = await ctx.db
      .query("likes")
      .withIndex("by_from", (q) => q.eq("fromUserId", userId))
      .collect();

    const passedIds = new Set(
      myLikes.filter((l) => l.action === "pass").map((l) => l.toUserId)
    );

    const results = await Promise.all(
      scores
        .filter((s) => s.score >= 70 && !passedIds.has(s.userB))
        .map(async (s) => {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", s.userB))
            .unique();

          if (!profile || profile.banned || !profile.approved) return null;
          if (!profile.profileImageId) return null;

          if (args.country && profile.country !== args.country) return null;
          if (args.minAge && profile.age < args.minAge) return null;
          if (args.maxAge && profile.age > args.maxAge) return null;
          if (args.minHeight && profile.height < args.minHeight) return null;
          if (args.maxHeight && profile.height > args.maxHeight) return null;
          if (args.religiousLevel && effectiveReligiousLevel(profile) !== args.religiousLevel) {
            return null;
          }
          if (args.education && profile.education !== args.education) return null;
          if (args.occupation && profile.occupation !== args.occupation) return null;
          if (args.children !== undefined && profile.children !== args.children) return null;

          let imageUrl = null;
          if (profile.profileImageId) {
            imageUrl = await ctx.storage.getUrl(profile.profileImageId);
          }

          const existingLike = myLikes.find((l) => l.toUserId === s.userB);

          return {
            userId: s.userB,
            name: profile.name,
            age: profile.age,
            country: profile.country,
            city: profile.city,
            height: profile.height,
            education: profile.education,
            occupation: profile.occupation,
            religiousLevel: effectiveReligiousLevel(profile),
            prayerFrequency: profile.prayerFrequency ?? "",
            imageUrl,
            score: s.score,
            liked: existingLike?.action === "like",
          };
        })
    );

    return results
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score);
  },
});

export const likeUser = mutation({
  args: {
    toUserId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("pass")),
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

    if (args.action === "like") {
      const reverseLike = await ctx.db
        .query("likes")
        .withIndex("by_pair", (q) =>
          q.eq("fromUserId", args.toUserId).eq("toUserId", userId)
        )
        .unique();

      const myProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      await ctx.db.insert("notifications", {
        userId: args.toUserId,
        type: "like",
        title: "Someone liked you!",
        body: `${myProfile?.name ?? "Someone"} liked your profile.`,
        read: false,
        relatedUserId: userId,
        createdAt: Date.now(),
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
          await ctx.db.insert("notifications", {
            userId: uid,
            type: "match",
            title: "New Match!",
            body: `You matched with ${uid === userId ? otherProfile?.name : myProfile?.name}!`,
            read: false,
            relatedUserId: uid === userId ? args.toUserId : userId,
            createdAt: Date.now(),
          });
        }

        return { matched: true, matchId, conversationId: convId };
      }
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

    return await Promise.all(
      allMatches.map(async (m) => {
        const otherId = m.userA === userId ? m.userB : m.userA;
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
    );
  },
});
