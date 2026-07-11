import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { assertStorageOwnership, requireAuthUserId } from "./lib/access";
import { requireAdmin } from "./lib/adminAuth";
import { writeAuditLog } from "./lib/auditLog";

const sourceValidator = v.union(
  v.literal("profile"),
  v.literal("questionnaire"),
  v.literal("contact_page"),
  v.literal("other")
);

const statusValidator = v.union(
  v.literal("open"),
  v.literal("reviewed"),
  v.literal("closed")
);

const MAX_MESSAGE = 2000;
const MAX_SUBJECT = 200;
const MEMBER_LIMIT = 5;
const MEMBER_WINDOW_MS = 60 * 60 * 1000;

const TOPIC_SUBJECTS: Record<
  "photo_upload" | "account" | "payment" | "other" | "contact_form",
  string
> = {
  photo_upload: "Can't upload profile photo",
  account: "Account help",
  payment: "Payment help",
  other: "Member support",
  contact_form: "Website contact form",
};

async function checkRateLimit(
  ctx: MutationCtx,
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimitBuckets")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  if (!existing || now - existing.windowStart >= windowMs) {
    if (existing) {
      await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    } else {
      await ctx.db.insert("rateLimitBuckets", {
        key,
        windowStart: now,
        count: 1,
      });
    }
    return { allowed: true as const };
  }

  if (existing.count >= limit) {
    return { allowed: false as const };
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
  return { allowed: true as const };
}

/** Logged-in members: report photo upload / account issues to admin. */
export const sendSupportMessage = mutation({
  args: {
    topic: v.union(
      v.literal("photo_upload"),
      v.literal("account"),
      v.literal("payment"),
      v.literal("other")
    ),
    message: v.string(),
    source: sourceValidator,
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const message = args.message.trim();
    if (message.length < 10) {
      throw new Error("Please write a bit more detail (at least 10 characters).");
    }
    if (message.length > MAX_MESSAGE) {
      throw new Error("Message is too long.");
    }

    const rate = await checkRateLimit(
      ctx,
      `support:${userId}`,
      MEMBER_LIMIT,
      MEMBER_WINDOW_MS
    );
    if (!rate.allowed) {
      throw new Error("Too many messages. Please try again later or use WhatsApp.");
    }

    if (args.imageId) {
      await assertStorageOwnership(ctx, userId, args.imageId);
    }

    const user = await ctx.db.get(userId);
    const subject = TOPIC_SUBJECTS[args.topic];

    return await ctx.db.insert("supportContacts", {
      userId,
      name: profile.name,
      email: user?.email,
      phone: profile.phone,
      topic: args.topic,
      subject,
      message,
      imageId: args.imageId,
      source: args.source,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

/** Public contact page — called from the Node contact action after validation. */
export const insertPublicContact = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 100);
    const email = args.email.trim().toLowerCase().slice(0, 254);
    const subject = args.subject.trim().slice(0, MAX_SUBJECT);
    const message = args.message.trim().slice(0, MAX_MESSAGE);

    return await ctx.db.insert("supportContacts", {
      name,
      email,
      topic: "contact_form",
      subject: subject || TOPIC_SUBJECTS.contact_form,
      message,
      source: "contact_page",
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const listMySupportMessages = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const rows = await ctx.db
      .query("supportContacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);

    return rows.map((row) => ({
      _id: row._id,
      topic: row.topic,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      source: row.source,
    }));
  },
});

export const listSupportContacts = query({
  args: {
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    await requireAdmin(ctx, userId);

    const rows = args.status
      ? await ctx.db
          .query("supportContacts")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(100)
      : await ctx.db
          .query("supportContacts")
          .withIndex("by_createdAt")
          .order("desc")
          .take(100);

    return await Promise.all(
      rows.map(async (row) => {
        const profile = row.userId
          ? await ctx.db
              .query("profiles")
              .withIndex("by_userId", (q) => q.eq("userId", row.userId!))
              .unique()
          : null;
        const imageUrl = row.imageId
          ? await ctx.storage.getUrl(row.imageId)
          : null;

        return {
          _id: row._id,
          userId: row.userId ?? null,
          profileId: profile?._id ?? null,
          name: row.name,
          email: row.email ?? null,
          phone: row.phone ?? profile?.phone ?? null,
          topic: row.topic,
          subject: row.subject,
          message: row.message,
          imageUrl,
          source: row.source,
          status: row.status,
          adminNotes: row.adminNotes ?? "",
          createdAt: row.createdAt,
          reviewedAt: row.reviewedAt ?? null,
        };
      })
    );
  },
});

export const updateSupportContactStatus = mutation({
  args: {
    contactId: v.id("supportContacts"),
    status: statusValidator,
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireAdmin(ctx, userId);

    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const notes = args.adminNotes?.trim();
    await ctx.db.patch(args.contactId, {
      status: args.status,
      adminNotes: notes || contact.adminNotes,
      reviewedAt: Date.now(),
      reviewedBy: userId,
    });

    await writeAuditLog(ctx, {
      actorUserId: userId,
      action: `support_contact_${args.status}`,
      targetUserId: contact.userId,
      metadata: JSON.stringify({ contactId: args.contactId, topic: contact.topic }),
    });

    return { ok: true as const };
  },
});
