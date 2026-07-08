import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertStorageOwnership,
  requireActiveProfile,
  requireAuthUserId,
  requireConversationParticipant,
} from "./lib/access";
import { hasPaidAccess } from "./lib/roles";
import { getBlockedUserIds, isEitherBlocked } from "./lib/moderation";
import { sendNotification } from "./lib/sendNotification";

export const getConversations = query({
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

    const activeMatches = [...matchesA, ...matchesB].filter(
      (m) => m.status === "active"
    );

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const paid = myProfile ? hasPaidAccess(myProfile) : false;
    const blockedIds = await getBlockedUserIds(ctx, userId);

    return (
      await Promise.all(
        activeMatches.map(async (m) => {
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

          const lastMessage = conversation
            ? await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) =>
                  q.eq("conversationId", conversation._id)
                )
                .order("desc")
                .first()
            : null;

          const unreadCount = conversation
            ? (
                await ctx.db
                  .query("messages")
                  .withIndex("by_conversation", (q) =>
                    q.eq("conversationId", conversation._id)
                  )
                  .collect()
              ).filter((msg) => !msg.read && msg.senderId !== userId).length
            : 0;

          return {
            matchId: m._id,
            conversationId: conversation?._id,
            chatUnlocked: paid || m.chatUnlocked,
            profile: profile
              ? {
                  name: profile.name,
                  imageUrl,
                  userId: otherId,
                  verified: profile.verified,
                  hasPaid: profile.hasPaid,
                  questionnaireComplete: profile.questionnaireComplete,
                }
              : null,
            lastMessage: lastMessage?.message ?? null,
            lastMessageAt: conversation?.lastMessageAt ?? 0,
            unreadCount,
          };
        })
      )
    ).filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation?.participants.includes(userId)) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        let imageUrl = null;
        if (msg.imageId) {
          imageUrl = await ctx.storage.getUrl(msg.imageId);
        }
        return { ...msg, imageUrl };
      })
    );
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    message: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);

    const conversation = await requireConversationParticipant(
      ctx,
      args.conversationId,
      userId
    );

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const match = await ctx.db.get(conversation.matchId);
    if (myProfile && !hasPaidAccess(myProfile) && !match?.chatUnlocked) {
      throw new Error("Please complete payment to unlock chat.");
    }

    const otherId = conversation.participants.find((p) => p !== userId);
    if (otherId && (await isEitherBlocked(ctx, userId, otherId))) {
      throw new Error("You cannot message this user");
    }

    if (args.imageId) {
      await assertStorageOwnership(ctx, userId, args.imageId);
    }

    const trimmedMessage = args.message.trim();
    if (!trimmedMessage && !args.imageId) {
      throw new Error("Message cannot be empty");
    }
    if (trimmedMessage.length > 2000) {
      throw new Error("Message is too long");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      message: trimmedMessage || "📷 Image",
      imageId: args.imageId,
      read: false,
      createdAt: Date.now(),
    });

    await ctx.db.patch(conversation._id, {
      lastMessageAt: Date.now(),
    });

    if (otherId) {
      const senderProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      await sendNotification(ctx, {
        userId: otherId,
        type: "message",
        title: "New Message",
        body: `${senderProfile?.name ?? "Someone"} sent you a message.`,
        relatedUserId: userId,
        sendEmail: true,
      });
    }

    return messageId;
  },
});

export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireConversationParticipant(ctx, args.conversationId, userId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const msg of messages) {
      if (msg.senderId !== userId && !msg.read) {
        await ctx.db.patch(msg._id, { read: true });
      }
    }
  },
});

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireActiveProfile(ctx, userId);
    await requireConversationParticipant(ctx, args.conversationId, userId);

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { isTyping: args.isTyping });
    } else {
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId,
        isTyping: args.isTyping,
      });
    }
  },
});

export const getTypingStatus = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireConversationParticipant(ctx, args.conversationId, userId);

    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return indicators.some((i) => i.userId !== userId && i.isTyping);
  },
});
