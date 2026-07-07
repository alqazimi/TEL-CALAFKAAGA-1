#!/usr/bin/env node
/**
 * Fix duplicated sk_live_/sk_test_ prefix on Convex STRIPE_SECRET_KEY.
 *
 * Usage:
 *   npm run fix:stripe:prod
 */

import { spawnSync } from "node:child_process";

const useProd = process.argv.includes("--prod") || true;

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

function convexEnvList() {
  const env = { ...process.env };
  delete env.CONVEX_DEPLOYMENT;

  const result = spawnSync("npx", ["convex", "env", "list", "--prod"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env,
  });

  if (result.status !== 0) {
    console.error(result.stderr?.trim() || "Could not read Convex production env.");
    process.exit(1);
  }

  const map = new Map();
  for (const line of result.stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
  }
  return map;
}

function convexEnvSet(name, value) {
  const args = ["convex", "env", "set", name];
  if (useProd) args.push("--prod");

  const result = spawnSync("npx", args, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    throw new Error(`Failed to set ${name}`);
  }
}

const map = convexEnvList();
const current = map.get("STRIPE_SECRET_KEY");

if (!current) {
  console.error("STRIPE_SECRET_KEY is not set on production Convex.");
  console.error("Run: npm run setup:stripe:prod -- sk_live_YOUR_KEY");
  process.exit(1);
}

const fixed = normalizeStripeSecretKey(current);

if (fixed === current) {
  console.log("STRIPE_SECRET_KEY on production Convex looks correct. No change needed.");
  process.exit(0);
}

if (!/^sk_(live|test)_[A-Za-z0-9]+$/.test(fixed)) {
  console.error("Normalized key still looks invalid. Set it manually from Stripe Dashboard:");
  console.error("  npm run setup:stripe:prod -- sk_live_YOUR_KEY");
  process.exit(1);
}

console.log("Fixing duplicated sk_live_/sk_test_ prefix on production STRIPE_SECRET_KEY...");
convexEnvSet("STRIPE_SECRET_KEY", fixed);
console.log("Done. Run `npm run preflight:prod` to verify.");
