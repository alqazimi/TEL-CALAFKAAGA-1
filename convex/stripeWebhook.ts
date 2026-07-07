import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const handleStripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await request.text();

  try {
    await ctx.runAction(internal.stripeWebhookNode.handleStripeEvent, {
      body,
      signature,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature";
    console.error("Stripe webhook signature verification failed:", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
