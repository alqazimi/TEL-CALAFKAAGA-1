import { Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

async function deleteStorageSafe(
  ctx: MutationCtx,
  storageId: Id<"_storage"> | undefined
) {
  if (!storageId) return;
  try {
    await ctx.storage.delete(storageId);
  } catch {
    // File may already be gone.
  }
}

/**
 * Permanently remove a member: profile, app data, auth account, and login user.
 * Caller must ensure the target is not staff.
 */
export async function deleteMemberAccount(
  ctx: MutationCtx,
  profileId: Id<"profiles">
) {
  const profile = await ctx.db.get(profileId);
  if (!profile) return { deleted: false as const };

  const targetUserId = profile.userId;

  // --- Profile media ---
  await deleteStorageSafe(ctx, profile.profileImageId);
  for (const imageId of profile.additionalImageIds ?? []) {
    await deleteStorageSafe(ctx, imageId);
  }

  const uploads = await ctx.db
    .query("userUploads")
    .filter((q) => q.eq(q.field("userId"), targetUserId))
    .collect();
  for (const upload of uploads) {
    await deleteStorageSafe(ctx, upload.storageId);
    await ctx.db.delete(upload._id);
  }

  // --- Preferences ---
  const preferences = await ctx.db
    .query("preferences")
    .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
    .unique();
  if (preferences) await ctx.db.delete(preferences._id);

  // --- Likes ---
  for (const like of await ctx.db
    .query("likes")
    .withIndex("by_from", (q) => q.eq("fromUserId", targetUserId))
    .collect()) {
    await ctx.db.delete(like._id);
  }
  for (const like of await ctx.db
    .query("likes")
    .withIndex("by_to", (q) => q.eq("toUserId", targetUserId))
    .collect()) {
    await ctx.db.delete(like._id);
  }

  // --- Compatibility ---
  for (const score of await ctx.db
    .query("compatibilityScores")
    .withIndex("by_userA", (q) => q.eq("userA", targetUserId))
    .collect()) {
    await ctx.db.delete(score._id);
  }
  for (const score of await ctx.db
    .query("compatibilityScores")
    .withIndex("by_userB", (q) => q.eq("userB", targetUserId))
    .collect()) {
    await ctx.db.delete(score._id);
  }

  // --- Matches, conversations, messages ---
  const matches = [
    ...(await ctx.db
      .query("matches")
      .withIndex("by_userA", (q) => q.eq("userA", targetUserId))
      .collect()),
    ...(await ctx.db
      .query("matches")
      .withIndex("by_userB", (q) => q.eq("userB", targetUserId))
      .collect()),
  ];

  for (const match of matches) {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_match", (q) => q.eq("matchId", match._id))
      .unique();
    if (conversation) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id)
        )
        .collect();
      for (const message of messages) {
        await deleteStorageSafe(ctx, message.imageId);
        await ctx.db.delete(message._id);
      }

      const typing = await ctx.db
        .query("typingIndicators")
        .filter((q) => q.eq(q.field("conversationId"), conversation._id))
        .collect();
      for (const row of typing) {
        await ctx.db.delete(row._id);
      }
      await ctx.db.delete(conversation._id);
    }
    await ctx.db.delete(match._id);
  }

  for (const message of await ctx.db
    .query("messages")
    .withIndex("by_sender", (q) => q.eq("senderId", targetUserId))
    .collect()) {
    await deleteStorageSafe(ctx, message.imageId);
    await ctx.db.delete(message._id);
  }

  // --- Notifications ---
  for (const notification of await ctx.db
    .query("notifications")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .collect()) {
    await ctx.db.delete(notification._id);
  }

  // --- Payments ---
  for (const payment of await ctx.db
    .query("payments")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .collect()) {
    await ctx.db.delete(payment._id);
  }

  // --- Blocks ---
  for (const block of await ctx.db
    .query("blocks")
    .withIndex("by_blocker", (q) => q.eq("blockerId", targetUserId))
    .collect()) {
    await ctx.db.delete(block._id);
  }
  for (const block of await ctx.db
    .query("blocks")
    .withIndex("by_blocked", (q) => q.eq("blockedId", targetUserId))
    .collect()) {
    await ctx.db.delete(block._id);
  }

  // --- Reports ---
  for (const report of await ctx.db
    .query("reports")
    .withIndex("by_reporter", (q) => q.eq("reporterId", targetUserId))
    .collect()) {
    await ctx.db.delete(report._id);
  }
  for (const report of await ctx.db
    .query("reports")
    .withIndex("by_reported", (q) => q.eq("reportedUserId", targetUserId))
    .collect()) {
    await ctx.db.delete(report._id);
  }

  // --- Email reminder log ---
  for (const log of await ctx.db
    .query("memberEmailLog")
    .filter((q) => q.eq(q.field("userId"), targetUserId))
    .collect()) {
    await ctx.db.delete(log._id);
  }

  // --- Profile row ---
  await ctx.db.delete(profileId);

  // --- Auth: sessions, refresh tokens, accounts, codes, user ---
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", targetUserId))
    .collect();
  for (const session of sessions) {
    for (const token of await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect()) {
      await ctx.db.delete(token._id);
    }
    await ctx.db.delete(session._id);
  }

  for (const account of await ctx.db
    .query("authAccounts")
    .filter((q) => q.eq(q.field("userId"), targetUserId))
    .collect()) {
    for (const code of await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .collect()) {
      await ctx.db.delete(code._id);
    }
    await ctx.db.delete(account._id);
  }

  if (await ctx.db.get(targetUserId)) {
    await ctx.db.delete(targetUserId);
  }

  return { deleted: true as const, userId: targetUserId };
}
