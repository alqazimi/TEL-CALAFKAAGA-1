import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Append an immutable staff action for accountability. */
export async function writeAuditLog(
  ctx: MutationCtx,
  args: {
    actorUserId: Id<"users">;
    action: string;
    targetUserId?: Id<"users">;
    targetProfileId?: Id<"profiles">;
    metadata?: Record<string, unknown> | string;
  }
) {
  const metadata =
    args.metadata === undefined
      ? undefined
      : typeof args.metadata === "string"
        ? args.metadata.slice(0, 2000)
        : JSON.stringify(args.metadata).slice(0, 2000);

  await ctx.db.insert("auditLogs", {
    actorUserId: args.actorUserId,
    action: args.action,
    targetUserId: args.targetUserId,
    targetProfileId: args.targetProfileId,
    metadata,
    createdAt: Date.now(),
  });
}
