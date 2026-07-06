#!/usr/bin/env node
/**
 * One-time setup: generate JWT keys and configure Convex Auth env vars.
 * Run: node scripts/setup-convex-auth.mjs
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { spawnSync } from "child_process";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3001";

function convexEnvSet(name, value) {
  const result = spawnSync("npx", ["convex", "env", "set", name], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    throw new Error(`Failed to set ${name}`);
  }
}

console.log("Generating JWT keys...");
const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

console.log("Setting Convex environment variables...");
convexEnvSet("JWT_PRIVATE_KEY", jwtPrivateKey);
convexEnvSet("JWKS", jwks);
convexEnvSet("SITE_URL", siteUrl);

console.log("\nConvex Auth configured successfully!");
console.log(`SITE_URL set to: ${siteUrl}`);
console.log("Restart `npx convex dev` if it's already running.");
