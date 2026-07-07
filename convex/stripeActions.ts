"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { REGISTRATION_AMOUNT_CENTS } from "./payments";

function normalizeStripeSecretKey(key: string): string {
  let normalized = key.trim();
  while (
    normalized.startsWith("sk_live_sk_live_") ||
    normalized.startsWith("sk_test_sk_test_")
  ) {
    normalized = normalized.startsWith("sk_live_sk_live_")
      ? normalized.slice("sk_live_".length)
      : normalized.slice("sk_test_".length);
  }
  return normalized;
}

function getStripeSecretKey(): string {
  const raw = process.env.STRIPE_SECRET_KEY;
  if (!raw) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured on Convex. Run: npx convex env set STRIPE_SECRET_KEY sk_live_..."
    );
  }

  const key = normalizeStripeSecretKey(raw);
  if (!/^sk_(live|test)_[A-Za-z0-9]+$/.test(key)) {
    throw new Error(
      "STRIPE_SECRET_KEY format is invalid. Copy the secret key from Stripe Dashboard → API keys."
    );
  }
  return key;
}

function getStripe() {
  return new Stripe(getStripeSecretKey());
}

function getAppUrl() {
  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3001"
  );
}

export const createRegistrationCheckout = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.runQuery(internal.payments.getProfileByUserId, {
      userId,
    });

    if (!profile) throw new Error("Profile not found");
    if (profile.hasPaid) {
      throw new Error("Already paid");
    }

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
                name: "Calaf Registration",
                description:
                  "One-time registration — lifetime access to Calaf",
              },
              unit_amount: REGISTRATION_AMOUNT_CENTS,
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
      amount: REGISTRATION_AMOUNT_CENTS,
      paymentType: "registration",
    });

    return { url: session.url };
  },
});

export const verifyCheckoutSession = action({
  args: { sessionId: v.string() },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; alreadyCompleted: boolean }> => {
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

    const result = await ctx.runMutation(internal.payments.markPaymentComplete, {
      userId,
      stripeSessionId: args.sessionId,
      matchId,
    });

    return { success: true, alreadyCompleted: result.alreadyCompleted };
  },
});
