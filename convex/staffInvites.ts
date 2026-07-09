import { getAuthUserId } from "@convex-dev/auth/server";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  getProfileForUser,
  normalizeEmail,
  requireOwner,
} from "./lib/adminAuth";
import { isStaffRole, STAFF_PROFILE_COMPLETION_PATCH } from "./lib/roles";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateInviteToken(): string {
  const random: RandomReader = {
    read(bytes) {
      crypto.getRandomValues(bytes);
    },
  };
  return generateRandomString(
    random,
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    48
  );
}

function isInviteActive(invite: {
  status: string;
  expiresAt: number;
}) {
  return invite.status === "pending" && invite.expiresAt > Date.now();
}

async function getUserByEmail(ctx: QueryCtx | MutationCtx, email: string) {
  return await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
}

async function assertCanInviteEmail(ctx: MutationCtx, email: string) {
  const existingUser = await getUserByEmail(ctx, email);
  if (existingUser) {
    const profile = await getProfileForUser(ctx, existingUser._id);
    if (profile && isStaffRole(profile.role)) {
      throw new Error("This email already has staff access.");
    }
  }

  const pendingInvites = await ctx.db
    .query("staffInvites")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();

  const hasActiveInvite = pendingInvites.some((invite) => isInviteActive(invite));
  if (hasActiveInvite) {
    throw new Error("A pending invite already exists for this email.");
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    await requireOwner(ctx, userId);

    const invites = await ctx.db.query("staffInvites").order("desc").collect();
    const now = Date.now();

    return invites.map((invite) => {
      const status =
        invite.status === "pending" && invite.expiresAt <= now
          ? ("expired" as const)
          : invite.status;
      return {
        _id: invite._id,
        email: invite.email,
        role: invite.role,
        status,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        acceptedAt: invite.acceptedAt,
      };
    });
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("staffInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invite) {
      return { valid: false as const, reason: "not_found" as const };
    }

    if (invite.status === "revoked") {
      return { valid: false as const, reason: "revoked" as const };
    }

    if (invite.status === "accepted") {
      return { valid: false as const, reason: "accepted" as const };
    }

    if (invite.status === "expired" || invite.expiresAt <= Date.now()) {
      return { valid: false as const, reason: "expired" as const };
    }

    return {
      valid: true as const,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  },
});

export const create = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOwner(ctx, userId);

    const email = normalizeEmail(args.email);
    if (!email.includes("@") || email.length < 5) {
      throw new Error("Enter a valid email address.");
    }

    await assertCanInviteEmail(ctx, email);

    const token = generateInviteToken();
    const now = Date.now();

    const inviteId = await ctx.db.insert("staffInvites", {
      email,
      token,
      role: "admin",
      invitedBy: userId,
      status: "pending",
      createdAt: now,
      expiresAt: now + INVITE_TTL_MS,
    });

    await ctx.scheduler.runAfter(0, internal.staffInviteEmail.send, {
      email,
      token,
    });

    return { inviteId, email };
  },
});

export const revoke = mutation({
  args: { inviteId: v.id("staffInvites") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOwner(ctx, userId);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found.");

    if (invite.status !== "pending") {
      throw new Error("Only pending invites can be revoked.");
    }

    await ctx.db.patch(args.inviteId, { status: "revoked" });
    return { success: true as const };
  },
});

export const resend = mutation({
  args: { inviteId: v.id("staffInvites") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOwner(ctx, userId);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found.");

    if (!isInviteActive(invite)) {
      throw new Error("Only active pending invites can be resent.");
    }

    await ctx.scheduler.runAfter(0, internal.staffInviteEmail.send, {
      email: invite.email,
      token: invite.token,
    });

    return { success: true as const };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invite = await ctx.db
      .query("staffInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invite) throw new Error("Invite not found.");

    if (invite.status === "revoked") {
      throw new Error("This invite was revoked.");
    }

    if (invite.status === "accepted") {
      throw new Error("This invite was already accepted.");
    }

    if (invite.status === "expired" || invite.expiresAt <= Date.now()) {
      await ctx.db.patch(invite._id, { status: "expired" });
      throw new Error("This invite has expired. Ask the owner for a new one.");
    }

    const user = await ctx.db.get(userId);
    const userEmail = user?.email;
    if (!userEmail) {
      throw new Error("Your account does not have an email address.");
    }

    if (normalizeEmail(userEmail) !== invite.email) {
      throw new Error("Sign in with the invited email address to accept.");
    }

    const profile = await getProfileForUser(ctx, userId);
    if (!profile) throw new Error("Profile not found.");

    if (profile.role === "owner") {
      throw new Error("The owner account cannot accept an admin invite.");
    }

    if (!isStaffRole(profile.role)) {
      await ctx.db.patch(profile._id, {
        role: "admin",
        ...STAFF_PROFILE_COMPLETION_PATCH,
      });
    }

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      acceptedByUserId: userId,
    });

    return { success: true as const };
  },
});
