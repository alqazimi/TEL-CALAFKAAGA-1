#!/usr/bin/env node
/**
 * Print the Stripe webhook URL for production Convex.
 *
 * Usage:
 *   npm run convex:webhook-url
 *   npm run convex:webhook-url:prod
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const useProd = process.argv.includes("--prod");
const PROD_CONVEX_URL = "https://effervescent-emu-618.eu-west-1.convex.cloud";

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    if (!existsSync(envPath)) return;
    const contents = readFileSync(envPath, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const convexUrl = useProd
  ? PROD_CONVEX_URL
  : (process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "");

if (!convexUrl) {
  console.error(
    "Set NEXT_PUBLIC_CONVEX_URL in .env.local or run `npm run convex:webhook-url:prod`."
  );
  process.exit(1);
}

const siteHost = convexUrl.replace(/\.convex\.cloud\/?$/, ".convex.site");
const webhookUrl = `${siteHost.replace(/\/$/, "")}/stripe/webhook`;

console.log(`Stripe webhook URL${useProd ? " (production)" : ""}:\n`);
console.log(`  ${webhookUrl}`);
console.log("\nStripe Dashboard → Webhooks → Add endpoint");
console.log("Event: checkout.session.completed");

if (!useProd && convexUrl.includes("valiant-caterpillar-349")) {
  console.log(
    "\nNote: .env.local uses dev Convex. For production use:\n  npm run convex:webhook-url:prod"
  );
}
