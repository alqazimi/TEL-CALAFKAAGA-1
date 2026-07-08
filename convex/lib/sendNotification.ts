import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { queueMemberEmail } from "./queueMemberEmail";

export type AppNotificationType =
  | "like"
  | "match"
  | "message"
  | "announcement"
  | "approval"
  | "payment";

const emailCtaByType: Partial<
  Record<AppNotificationType, { label: string; path: string }>
> = {
  approval: { label: "Browse matches", path: "/matches" },
  payment: { label: "View dashboard", path: "/dashboard" },
  like: { label: "See who liked you", path: "/matches" },
  match: { label: "Open matches", path: "/matches" },
  message: { label: "Open messages", path: "/chat" },
};

export async function sendNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    type: AppNotificationType;
    title: string;
    body: string;
    relatedUserId?: Id<"users">;
    sendEmail?: boolean;
    emailCta?: { label: string; path: string };
  }
) {
  await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    read: false,
    relatedUserId: args.relatedUserId,
    createdAt: Date.now(),
  });

  if (!args.sendEmail) return;

  const cta = args.emailCta ?? emailCtaByType[args.type];
  if (!cta) return;

  await queueMemberEmail(ctx, {
    userId: args.userId,
    subject: args.title,
    body: args.body,
    ctaLabel: cta.label,
    ctaPath: cta.path,
  });
}
