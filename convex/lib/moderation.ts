import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** True if either user has blocked the other. */
export async function isEitherBlocked(
  ctx: Ctx,
  userA: Id<"users">,
  userB: Id<"users">
): Promise<boolean> {
  const aBlocksB = await ctx.db
    .query("blocks")
    .withIndex("by_pair", (q) => q.eq("blockerId", userA).eq("blockedId", userB))
    .unique();
  if (aBlocksB) return true;

  const bBlocksA = await ctx.db
    .query("blocks")
    .withIndex("by_pair", (q) => q.eq("blockerId", userB).eq("blockedId", userA))
    .unique();
  return bBlocksA !== null;
}

/** User IDs that the viewer blocked, or who blocked the viewer. */
export async function getBlockedUserIds(
  ctx: Ctx,
  userId: Id<"users">
): Promise<Set<Id<"users">>> {
  const blocked = new Set<Id<"users">>();

  const outgoing = await ctx.db
    .query("blocks")
    .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
    .collect();
  for (const row of outgoing) blocked.add(row.blockedId);

  const incoming = await ctx.db
    .query("blocks")
    .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
    .collect();
  for (const row of incoming) blocked.add(row.blockerId);

  return blocked;
}

/** Mark all active matches between two users as unmatched. */
export async function unmatchBetweenUsers(
  ctx: MutationCtx,
  userA: Id<"users">,
  userB: Id<"users">
) {
  const asA = await ctx.db
    .query("matches")
    .withIndex("by_userA", (q) => q.eq("userA", userA))
    .collect();
  const asB = await ctx.db
    .query("matches")
    .withIndex("by_userB", (q) => q.eq("userB", userA))
    .collect();

  for (const match of [...asA, ...asB]) {
    const other = match.userA === userA ? match.userB : match.userA;
    if (
      other === userB &&
      (match.status === "active" || match.status === "archived")
    ) {
      await ctx.db.patch(match._id, { status: "unmatched", chatUnlocked: false });
    }
  }
}

export const REPORT_REASONS = [
  "fake_profile",
  "inappropriate",
  "harassment",
  "spam",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
