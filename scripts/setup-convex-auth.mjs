#!/usr/bin/env node
/**
 * Generate JWT keys and configure Convex Auth env vars.
 *
 * Dev (local):
 *   SITE_URL=http://localhost:3001 npm run setup:auth
 *
 * Production (Vercel):
 *   SITE_URL=https://your-app.vercel.app npm run setup:auth:prod
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { spawnSync } from "child_process";

const args = process.argv.slice(2);
const useProd = args.includes("--prod");
const siteUrl = process.env.SITE_URL ?? "http://localhost:3001";

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
    ? "Configuring Convex Auth on PRODUCTION deployment..."
    : "Configuring Convex Auth on DEV deployment..."
);
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
console.log(
  useProd
    ? "Production deployment is ready for Vercel."
    : "Restart `npx convex dev` if it's already running."
);
if (useProd) {
  console.log(
    "\nNext: set NEXT_PUBLIC_CONVEX_URL in Vercel to your PRODUCTION Convex URL"
  );
  console.log("(run `npx convex deploy` and copy the URL from the output).");
}
