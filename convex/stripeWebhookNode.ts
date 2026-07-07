"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getStripe, getStripeWebhookSecret } from "./lib/stripe";
import {
  PERSONAL_SUPPORT_AMOUNT_CENTS,
  REGISTRATION_AMOUNT_CENTS,
} from "./payments";

export const handleStripeEvent = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      args.body,
      args.signature,
      getStripeWebhookSecret()
    );

    if (event.type !== "checkout.session.completed") {
      return;
    }

    const session = event.data.object;

    if (session.payment_status !== "paid") {
      return;
    }

    const userId = session.metadata?.userId;
    if (!userId) {
      console.error("checkout.session.completed missing metadata.userId");
      throw new Error("Missing userId metadata");
    }

    const isChat = session.metadata?.type === "chat";
    const isPremium = session.metadata?.tier === "premium";
    const paymentType = isChat
      ? "chat"
      : isPremium
        ? "registration_premium"
        : "registration";
    const matchId = session.metadata?.matchId;

    await ctx.runMutation(internal.payments.fulfillCheckoutSession, {
      stripeSessionId: session.id,
      userId: userId as Id<"users">,
      amount:
        session.amount_total ??
        (isPremium
          ? PERSONAL_SUPPORT_AMOUNT_CENTS
          : REGISTRATION_AMOUNT_CENTS),
      paymentType,
      registrationTier: isChat
        ? undefined
        : isPremium
          ? "premium"
          : "basic",
      matchId: matchId ? (matchId as Id<"matches">) : undefined,
    });
  },
});
