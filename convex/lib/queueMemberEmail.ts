import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function queueMemberEmail(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    subject: string;
    body: string;
    ctaLabel: string;
    ctaPath: string;
  }
) {
  const user = await ctx.db.get(args.userId);
  const email = user?.email?.trim();
  if (!email) return;

  await ctx.scheduler.runAfter(0, internal.memberEmails.send, {
    email,
    subject: args.subject,
    body: args.body,
    ctaLabel: args.ctaLabel,
    ctaPath: args.ctaPath,
  });
}
