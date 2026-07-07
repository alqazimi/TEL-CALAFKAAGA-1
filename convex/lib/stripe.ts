import Stripe from "stripe";

export function normalizeStripeSecretKey(key: string): string {
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

export function getStripeSecretKey(): string {
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

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured on Convex. Run: npx convex env set STRIPE_WEBHOOK_SECRET whsec_..."
    );
  }
  if (!/^whsec_[A-Za-z0-9]+$/.test(secret)) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET format is invalid. Copy it from Stripe Dashboard → Webhooks."
    );
  }
  return secret;
}

export function getStripe() {
  return new Stripe(getStripeSecretKey());
}

export function getAppUrl() {
  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3001"
  );
}
