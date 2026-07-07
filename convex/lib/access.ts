import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireAuthUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export async function requireActiveProfile(ctx: Ctx, userId: Id<"users">) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (!profile) {
    throw new Error("Profile not found");
  }

  if (profile.banned) {
    throw new Error("Account suspended");
  }

  return profile;
}

export async function requireConversationParticipant(
  ctx: Ctx,
  conversationId: Id<"conversations">,
  userId: Id<"users">
) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation?.participants.includes(userId)) {
    throw new Error("Not authorized");
  }
  return conversation;
}

export async function assertStorageOwnership(
  ctx: MutationCtx,
  userId: Id<"users">,
  storageId: Id<"_storage">
) {
  const upload = await ctx.db
    .query("userUploads")
    .withIndex("by_storage", (q) => q.eq("storageId", storageId))
    .unique();

  if (!upload || upload.userId !== userId) {
    throw new Error("Invalid file upload");
  }
}
