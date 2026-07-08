#!/usr/bin/env node
/**
 * Pre-deploy checks for Calaf (local .env.local + optional Convex prod env).
 *
 * Usage:
 *   npm run preflight
 *   npm run preflight:prod
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const useProd = process.argv.includes("--prod");

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
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

function convexProdEnvMap() {
  const env = { ...process.env };
  delete env.CONVEX_DEPLOYMENT;

  const result = spawnSync("npx", ["convex", "env", "list", "--prod"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env,
  });

  if (result.status !== 0) {
    return {
      error:
        result.stderr?.trim() ||
        "Could not read production Convex env (run `npx convex login`).",
    };
  }

  const map = new Map();
  for (const line of result.stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    map.set(key, value);
  }
  return { map };
}

function maskValue(key, value) {
  if (/SECRET|KEY|JWT|PRIVATE/i.test(key)) {
    return value ? `${value.slice(0, 8)}…` : "(empty)";
  }
  return value;
}

loadEnvLocal();

const checks = [];
let failed = 0;

function pass(label) {
  checks.push({ ok: true, label });
}

function warn(label) {
  checks.push({ ok: "warn", label });
}

function fail(label) {
  checks.push({ ok: false, label });
  failed += 1;
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const stripePk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const prodConvexUrl = "https://effervescent-emu-618.eu-west-1.convex.cloud";

if (convexUrl?.includes(".convex.cloud")) {
  pass(`NEXT_PUBLIC_CONVEX_URL = ${convexUrl} (frontend → Convex)`);
  if (useProd && convexUrl.includes("valiant-caterpillar-349")) {
    fail(
      `.env.local still points at DEV Convex — use production URL: ${prodConvexUrl}`
    );
  }
} else {
  fail("NEXT_PUBLIC_CONVEX_URL missing or invalid");
}

if (appUrl) {
  if (useProd && appUrl.includes("localhost")) {
    pass(`NEXT_PUBLIC_APP_URL = ${appUrl} (fine for local dev)`);
    warn(
      "On Vercel only: set NEXT_PUBLIC_APP_URL=https://helcalafkaaga.com (localhost here is normal)"
    );
  } else {
    pass(`NEXT_PUBLIC_APP_URL = ${appUrl}`);
  }
} else {
  fail("NEXT_PUBLIC_APP_URL not set");
}

if (stripePk?.startsWith("pk_")) pass("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set");
else fail("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing or invalid");

if (useProd) {
  const prod = convexProdEnvMap();
  if ("error" in prod) {
    fail(prod.error);
  } else {
    const { map } = prod;
    const required = [
      "SITE_URL",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "AUTH_RESEND_KEY",
    ];

    for (const key of required) {
      const value = map.get(key);
      if (!value) {
        fail(`${key} not set on Convex (production)`);
        continue;
      }

      if (key === "STRIPE_SECRET_KEY" && value.includes("sk_live_sk_live_")) {
        fail(
          "STRIPE_SECRET_KEY has duplicated sk_live_ prefix — run: npm run fix:stripe:prod"
        );
        continue;
      }

      if (
        key === "AUTH_RESEND_KEY" &&
        (value.length < 20 || value === "re_..." || value.includes("YOUR_RESEND"))
      ) {
        fail(
          "AUTH_RESEND_KEY looks like a placeholder — run: npm run setup:resend:prod -- re_YOUR_REAL_KEY"
        );
        continue;
      }

      pass(`${key} on Convex (production) = ${maskValue(key, value)}`);
    }
  }
}

console.log(`Calaf preflight${useProd ? " (production)" : ""}\n`);
for (const check of checks) {
  const icon = check.ok === true ? "✓" : check.ok === "warn" ? "⚠" : "✗";
  console.log(`${icon} ${check.label}`);
}

if (!useProd) {
  console.log("\nTip: run `npm run preflight:prod` after `npx convex deploy`.");
}

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
