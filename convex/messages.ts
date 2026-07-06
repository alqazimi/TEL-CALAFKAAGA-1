import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    return await Promise.all(
      activeMatches.map(async (m) => {
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
          chatUnlocked: m.chatUnlocked,
          profile: profile
            ? { name: profile.name, imageUrl, userId: otherId }
            : null,
          lastMessage: lastMessage?.message ?? null,
          lastMessageAt: conversation?.lastMessageAt ?? 0,
          unreadCount,
        };
      })
    );
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation?.participants.includes(userId)) {
      throw new Error("Not authorized");
    }

    const match = await ctx.db.get(conversation.matchId);
    if (!match?.chatUnlocked) {
      throw new Error("Chat not unlocked. Please complete payment.");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      message: args.message,
      imageId: args.imageId,
      read: false,
      createdAt: Date.now(),
    });

    await ctx.db.patch(conversation._id, {
      lastMessageAt: Date.now(),
    });

    const otherId = conversation.participants.find((p) => p !== userId);
    if (otherId) {
      const senderProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      await ctx.db.insert("notifications", {
        userId: otherId,
        type: "message",
        title: "New Message",
        body: `${senderProfile?.name ?? "Someone"} sent you a message.`,
        read: false,
        relatedUserId: userId,
        createdAt: Date.now(),
      });
    }

    return messageId;
  },
});

export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return indicators.some((i) => i.userId !== userId && i.isTyping);
  },
});
