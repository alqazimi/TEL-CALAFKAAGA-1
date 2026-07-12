import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertStorageOwnership,
  requireActiveProfile,
  requireAuthUserId,
} from "./lib/access";
import { requireAdmin } from "./lib/adminAuth";
import { writeAuditLog } from "./lib/auditLog";
import { grantPaidAccess } from "./lib/grantPaidAccess";
import { assertValidImageUpload } from "./lib/uploadValidation";
import {
  PERSONAL_SUPPORT_AMOUNT_CENTS,
  PREMIUM_UPGRADE_AMOUNT_CENTS,
  REGISTRATION_AMOUNT_CENTS,
  WOMEN_BASIC_AMOUNT_CENTS,
} from "./payments";
import { sendNotification } from "./lib/sendNotification";

const tierValidator = v.union(v.literal("basic"), v.literal("premium"));

function amountForTier(
  tier: "basic" | "premium",
  gender: "male" | "female"
): number {
  if (tier === "premium") {
    return gender === "female"
      ? PREMIUM_UPGRADE_AMOUNT_CENTS
      : PERSONAL_SUPPORT_AMOUNT_CENTS;
  }
  return gender === "female" ? WOMEN_BASIC_AMOUNT_CENTS : REGISTRATION_AMOUNT_CENTS;
}

function normalizeLastFour(raw: string): string {
  return raw.replace(/\D/g, "").slice(-4);
}

/** Member: latest EVC submission for the payment screen. */
export const myLatestProof = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const proofs = await ctx.db
      .query("evcPaymentProofs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (proofs.length === 0) return null;
    proofs.sort((a, b) => b.createdAt - a.createdAt);
    const latest = proofs[0]!;
    const screenshotUrl = await ctx.storage.getUrl(latest.screenshotId);
    return { ...latest, screenshotUrl };
  },
});

/** Member: submit EVC payment proof after sending money. */
export const submitProof = mutation({
  args: {
    tier: tierValidator,
    payerFullName: v.string(),
    lastFourDigits: v.string(),
    screenshotId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const profile = await requireActiveProfile(ctx, userId);

    const isPremiumUpgrade =
      profile.hasPaid === true &&
      profile.hasPersonalSupport !== true &&
      args.tier === "premium";

    if (profile.hasPaid && !isPremiumUpgrade) {
      throw new Error("You already have paid access.");
    }

    const name = args.payerFullName.trim();
    if (name.length < 3 || name.length > 120) {
      throw new Error("Please enter your full name.");
    }

    const lastFour = normalizeLastFour(args.lastFourDigits);
    if (lastFour.length !== 4) {
      throw new Error("Enter the last 4 digits of the phone you paid from.");
    }

    await assertStorageOwnership(ctx, userId, args.screenshotId);
    await assertValidImageUpload(ctx, args.screenshotId);

    const existingPending = await ctx.db
      .query("evcPaymentProofs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const proof of existingPending) {
      if (proof.status === "pending") {
        throw new Error(
          "You already have a payment proof waiting for admin review."
        );
      }
    }

    const amountCents = isPremiumUpgrade
      ? PREMIUM_UPGRADE_AMOUNT_CENTS
      : amountForTier(args.tier, profile.gender);
    const proofId = await ctx.db.insert("evcPaymentProofs", {
      userId,
      profileId: profile._id,
      tier: args.tier,
      payerFullName: name,
      lastFourDigits: lastFour,
      screenshotId: args.screenshotId,
      amountCents,
      status: "pending",
      createdAt: Date.now(),
    });

    return { proofId };
  },
});

/** Admin: pending EVC proofs (newest first). */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    await requireAdmin(ctx, userId);

    const pending = await ctx.db
      .query("evcPaymentProofs")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(100);

    return await Promise.all(
      pending.map(async (proof) => {
        const user = await ctx.db.get(proof.userId);
        const profile = await ctx.db.get(proof.profileId);
        const screenshotUrl = await ctx.storage.getUrl(proof.screenshotId);
        return {
          ...proof,
          screenshotUrl,
          userEmail: user?.email ?? null,
          userPhone: profile?.phone ?? user?.phone ?? null,
          profileName: profile?.name ?? null,
          gender: profile?.gender ?? null,
        };
      })
    );
  },
});

/** Admin: count of pending EVC proofs (badge). */
export const pendingCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || (profile.role !== "admin" && profile.role !== "owner")) {
      return 0;
    }

    const pending = await ctx.db
      .query("evcPaymentProofs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(200);
    return pending.length;
  },
});

/** Admin: approve EVC proof → unlock paid access. */
export const approveProof = mutation({
  args: { proofId: v.id("evcPaymentProofs") },
  handler: async (ctx, args) => {
    const adminId = await requireAuthUserId(ctx);
    await requireAdmin(ctx, adminId);

    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new Error("Payment proof not found");
    if (proof.status !== "pending") {
      throw new Error("This payment was already reviewed.");
    }

    const profile = await ctx.db.get(proof.profileId);
    const isPremium = proof.tier === "premium";
    const isUpgrade =
      isPremium &&
      profile?.hasPaid === true &&
      profile?.hasPersonalSupport !== true;
    const paymentType = isUpgrade
      ? "premium_upgrade"
      : isPremium
        ? "registration_premium"
        : "registration";

    const paymentId = await ctx.db.insert("payments", {
      userId: proof.userId,
      stripeSessionId: `evc:${proof._id}`,
      amount: proof.amountCents,
      paymentType,
      registrationTier: proof.tier,
      status: "completed",
      createdAt: Date.now(),
    });

    await grantPaidAccess(ctx, {
      userId: proof.userId,
      isPremium,
      isUpgrade,
      notify: true,
    });

    // Unlock chats (same as Stripe path)
    const matchesA = await ctx.db
      .query("matches")
      .withIndex("by_userA", (q) => q.eq("userA", proof.userId))
      .collect();
    const matchesB = await ctx.db
      .query("matches")
      .withIndex("by_userB", (q) => q.eq("userB", proof.userId))
      .collect();
    for (const match of [...matchesA, ...matchesB]) {
      if (!match.chatUnlocked) {
        await ctx.db.patch(match._id, { chatUnlocked: true });
      }
    }

    await ctx.db.patch(proof._id, {
      status: "approved",
      reviewedAt: Date.now(),
      reviewedBy: adminId,
    });

    await writeAuditLog(ctx, {
      actorUserId: adminId,
      action: "evc_payment_approved",
      targetUserId: proof.userId,
      targetProfileId: proof.profileId,
      metadata: { proofId: proof._id, paymentId, tier: proof.tier },
    });

    return { ok: true as const };
  },
});

/** Admin: reject EVC proof. */
export const rejectProof = mutation({
  args: {
    proofId: v.id("evcPaymentProofs"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAuthUserId(ctx);
    await requireAdmin(ctx, adminId);

    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new Error("Payment proof not found");
    if (proof.status !== "pending") {
      throw new Error("This payment was already reviewed.");
    }

    const reason = (args.reason ?? "").trim().slice(0, 500);

    await ctx.db.patch(proof._id, {
      status: "rejected",
      reviewedAt: Date.now(),
      reviewedBy: adminId,
      rejectionReason: reason || undefined,
    });

    await sendNotification(ctx, {
      userId: proof.userId,
      type: "payment",
      title: "Payment not approved",
      body: reason
        ? `Your EVC payment proof was not approved: ${reason}`
        : "Your EVC payment proof was not approved. Please check the details and submit again, or contact support.",
      sendEmail: true,
    });

    await writeAuditLog(ctx, {
      actorUserId: adminId,
      action: "evc_payment_rejected",
      targetUserId: proof.userId,
      targetProfileId: proof.profileId,
      metadata: { proofId: proof._id, reason: reason || null },
    });

    return { ok: true as const };
  },
});
