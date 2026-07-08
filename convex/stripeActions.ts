"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAppUrl, getStripe } from "./lib/stripe";
import {
  PERSONAL_SUPPORT_AMOUNT_CENTS,
  REGISTRATION_AMOUNT_CENTS,
} from "./payments";
import { hasPaidAccess } from "./lib/roles";
import {
  isPremiumMember,
  PREMIUM_UPGRADE_AMOUNT_CENTS,
} from "./lib/premium";

const registrationTierValidator = v.union(
  v.literal("basic"),
  v.literal("premium")
);

function getRegistrationCheckoutDetails(tier: "basic" | "premium") {
  if (tier === "premium") {
    return {
      amount: PERSONAL_SUPPORT_AMOUNT_CENTS,
      paymentType: "registration_premium" as const,
      registrationTier: "premium" as const,
      productName: "Hel Calafkaaga Registration + Personal Support",
      productDescription:
        "Registration plus one-on-one guidance from trained experts to build a healthy marriage relationship",
    };
  }

  return {
    amount: REGISTRATION_AMOUNT_CENTS,
    paymentType: "registration" as const,
    registrationTier: "basic" as const,
    productName: "Hel Calafkaaga Registration",
    productDescription: "One-time registration — lifetime access to Hel Calafkaaga",
  };
}

export const createRegistrationCheckout = action({
  args: {
    tier: registrationTierValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.runQuery(internal.payments.getProfileByUserId, {
      userId,
    });

    if (!profile) throw new Error("Profile not found");
    if (profile.banned) throw new Error("Account suspended");
    if (hasPaidAccess(profile)) {
      throw new Error("Already paid");
    }

    const checkout = getRegistrationCheckoutDetails(args.tier);
    const stripe = getStripe();
    const appUrl = getAppUrl();

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: checkout.productName,
                description: checkout.productDescription,
              },
              unit_amount: checkout.amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/payment?canceled=true`,
        metadata: {
          userId,
          type: "registration",
          tier: checkout.registrationTier,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Stripe checkout failed";
      if (/invalid api key/i.test(message)) {
        throw new Error(
          "Stripe secret key is invalid on Convex. Re-copy it from Stripe Dashboard → API keys, then run: npx convex env set STRIPE_SECRET_KEY sk_live_..."
        );
      }
      throw error;
    }

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session");
    }

    await ctx.runMutation(internal.payments.recordPendingPayment, {
      userId,
      stripeSessionId: session.id,
      amount: checkout.amount,
      paymentType: checkout.paymentType,
      registrationTier: checkout.registrationTier,
    });

    return { url: session.url };
  },
});

export const createPremiumUpgradeCheckout = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.runQuery(internal.payments.getProfileByUserId, {
      userId,
    });

    if (!profile) throw new Error("Profile not found");
    if (profile.banned) throw new Error("Account suspended");
    if (!hasPaidAccess(profile)) {
      throw new Error("Complete basic registration before upgrading");
    }
    if (isPremiumMember(profile)) {
      throw new Error("Already on the premium plan");
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Hel Calafkaaga Premium Upgrade",
              description:
                "Upgrade to personal support — priority approval, who liked you, extra photos, and advisor guidance",
            },
            unit_amount: PREMIUM_UPGRADE_AMOUNT_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/profile?upgrade_canceled=true`,
      metadata: {
        userId,
        type: "premium_upgrade",
        tier: "premium",
      },
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session");
    }

    await ctx.runMutation(internal.payments.recordPendingPayment, {
      userId,
      stripeSessionId: session.id,
      amount: PREMIUM_UPGRADE_AMOUNT_CENTS,
      paymentType: "premium_upgrade",
      registrationTier: "premium",
    });

    return { url: session.url };
  },
});

export const verifyCheckoutSession = action({
  args: { sessionId: v.string() },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; alreadyCompleted: boolean; isPremium: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    if (session.metadata?.userId !== userId) {
      throw new Error("Payment session does not belong to this account");
    }

    const matchId = session.metadata?.matchId
      ? (session.metadata.matchId as import("./_generated/dataModel").Id<"matches">)
      : undefined;

    const isChat = session.metadata?.type === "chat";
    const isUpgrade = session.metadata?.type === "premium_upgrade";
    const isPremium = session.metadata?.tier === "premium" || isUpgrade;
    const paymentType = isChat
      ? "chat"
      : isUpgrade
        ? "premium_upgrade"
        : isPremium
          ? "registration_premium"
          : "registration";

    const result = await ctx.runMutation(
      internal.payments.fulfillCheckoutSession,
      {
        stripeSessionId: args.sessionId,
        userId,
        amount:
          session.amount_total ??
          (isUpgrade
            ? PREMIUM_UPGRADE_AMOUNT_CENTS
            : isPremium
              ? PERSONAL_SUPPORT_AMOUNT_CENTS
              : REGISTRATION_AMOUNT_CENTS),
        paymentType,
        registrationTier: isChat ? undefined : isPremium ? "premium" : "basic",
        matchId,
      }
    );

    return {
      success: true,
      alreadyCompleted: result.alreadyCompleted,
      isPremium: !isChat && isPremium,
    };
  },
});
