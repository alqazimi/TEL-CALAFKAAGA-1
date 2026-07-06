import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const { matchId, userId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Calaf Chat Unlock",
              description: "Unlock chat with your match",
            },
            unit_amount: 1500,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat?success=true&match_id=${matchId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat?canceled=true`,
      metadata: { matchId, userId },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
