#!/usr/bin/env node
/**
 * Configure Resend email on Convex (password reset & contact form).
 *
 * Usage:
 *   node scripts/setup-resend.mjs re_YOUR_RESEND_KEY
 *   node scripts/setup-resend.mjs re_YOUR_RESEND_KEY --prod
 *   AUTH_EMAIL_FROM="Calaf <hello@helcalafkaaga.com>" SUPPORT_EMAIL=hello@helcalafkaaga.com \
 *     node scripts/setup-resend.mjs re_YOUR_KEY --prod
 */
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const useProd = args.includes("--prod");
const apiKey = args.find((a) => a.startsWith("re_"));

if (!apiKey) {
  console.error("Usage: node scripts/setup-resend.mjs re_YOUR_RESEND_KEY [--prod]");
  process.exit(1);
}

function convexEnvSet(name, value) {
  const convexArgs = ["convex", "env", "set", name];
  if (useProd) convexArgs.push("--prod");

  const result = spawnSync("npx", convexArgs, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    throw new Error(`Failed to set ${name}`);
  }
}

console.log(
  useProd
    ? "Configuring Resend on PRODUCTION Convex deployment..."
    : "Configuring Resend on DEV Convex deployment..."
);

convexEnvSet("AUTH_RESEND_KEY", apiKey.trim());

const emailFrom = process.env.AUTH_EMAIL_FROM?.trim();
const supportEmail = process.env.SUPPORT_EMAIL?.trim();

if (emailFrom) {
  convexEnvSet("AUTH_EMAIL_FROM", emailFrom);
  console.log(`AUTH_EMAIL_FROM set to: ${emailFrom}`);
} else {
  console.log(
    "Tip: set AUTH_EMAIL_FROM (e.g. Calaf <hello@helcalafkaaga.com>) after verifying your domain in Resend."
  );
}

if (supportEmail) {
  convexEnvSet("SUPPORT_EMAIL", supportEmail);
  console.log(`SUPPORT_EMAIL set to: ${supportEmail}`);
}

console.log("\nResend configured successfully!");
if (useProd) {
  console.log(
    "Verify helcalafkaaga.com in Resend so production emails are not sent from onboarding@resend.dev."
  );
}
