#!/usr/bin/env node
/**
 * Generate a one-time admin bootstrap secret and print Convex setup commands.
 *
 * Usage:
 *   npm run bootstrap:admin -- you@example.com
 *   npm run bootstrap:admin:prod -- you@example.com
 */

import { randomBytes } from "node:crypto";

const useProd = process.argv.includes("--prod");
const email = process.argv.find((arg) => arg.includes("@"));

if (!email) {
  console.error("Usage: npm run bootstrap:admin -- you@example.com [--prod]");
  process.exit(1);
}

const secret = randomBytes(32).toString("base64");
const prodFlag = useProd ? " --prod" : "";

console.log("Calaf admin bootstrap\n");
console.log(`Email:  ${email}`);
console.log(`Secret: ${secret}\n`);
console.log("Run these commands (save the secret somewhere safe):\n");
console.log(`npx convex env set ADMIN_BOOTSTRAP_EMAIL ${email}${prodFlag}`);
console.log(`npx convex env set ADMIN_BOOTSTRAP_SECRET '${secret}'${prodFlag}`);
console.log("\nThen:");
console.log("1. Register or sign in with that email");
console.log("2. Open /admin and claim owner access");
console.log("3. Unset ADMIN_BOOTSTRAP_SECRET on Convex after claiming (optional)");
