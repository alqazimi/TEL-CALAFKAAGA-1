#!/usr/bin/env node
/**
 * Set Stripe secret key on Convex (dev or prod).
 *
 * Usage:
 *   node scripts/setup-stripe.mjs sk_live_YOUR_KEY
 *   node scripts/setup-stripe.mjs sk_live_YOUR_KEY --prod
 *
 * Paste the exact secret from Stripe Dashboard → API keys.
 * Do not add an extra sk_live_ prefix.
 */

import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const prod = args.includes("--prod");
const rawKey = args.find((a) => a.startsWith("sk_"));

if (!rawKey) {
  console.error("Usage: node scripts/setup-stripe.mjs sk_live_YOUR_KEY [--prod]");
  process.exit(1);
}

function normalizeStripeSecretKey(key) {
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

const key = normalizeStripeSecretKey(rawKey);

if (rawKey !== key) {
  console.warn("Warning: removed duplicated sk_live_/sk_test_ prefix from the key.");
}

if (!/^sk_(live|test)_[A-Za-z0-9]+$/.test(key)) {
  console.error("Invalid Stripe secret key format. Copy it from Stripe Dashboard → API keys.");
  process.exit(1);
}

const target = prod ? "production (--prod)" : "development";
const flag = prod ? " --prod" : "";

console.log(`Setting STRIPE_SECRET_KEY on Convex ${target}...`);
execSync(`npx convex env set STRIPE_SECRET_KEY ${key}${flag}`, {
  stdio: "inherit",
});

console.log("Done. Redeploy if needed: npx convex deploy");
