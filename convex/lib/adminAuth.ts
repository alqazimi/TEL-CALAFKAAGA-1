import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function countAdmins(ctx: QueryCtx | MutationCtx): Promise<number> {
  const profiles = await ctx.db.query("profiles").collect();
  return profiles.filter((p) => p.role === "admin").length;
}

export async function getProfileForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const profile = await getProfileForUser(ctx, userId);

  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return profile;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function secretsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyBootstrapCredentials(secret: string, userEmail: string | undefined) {
  const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const expectedEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;

  if (!expectedSecret || !expectedEmail) {
    throw new Error(
      "Admin bootstrap is not configured. Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_SECRET in Convex."
    );
  }

  if (!userEmail) {
    throw new Error("Your account does not have an email address.");
  }

  if (normalizeEmail(userEmail) !== normalizeEmail(expectedEmail)) {
    throw new Error("This account is not authorized to claim the first admin role.");
  }

  if (!secretsMatch(secret, expectedSecret)) {
    throw new Error("Invalid bootstrap secret.");
  }
}
