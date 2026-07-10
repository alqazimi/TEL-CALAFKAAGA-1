import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { hasPaidAccess, isOwnerRole, isStaffRole } from "./roles";

/** Fast existence check — avoids scanning every profile. */
export async function hasAnyStaff(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const owner = await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", "owner"))
    .first();
  if (owner) return true;
  const admin = await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .first();
  return !!admin;
}

export async function countStaff(ctx: QueryCtx | MutationCtx): Promise<number> {
  const owners = await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", "owner"))
    .collect();
  const admins = await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .collect();
  return owners.length + admins.length;
}

export async function countOwners(ctx: QueryCtx | MutationCtx): Promise<number> {
  const owners = await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", "owner"))
    .collect();
  return owners.length;
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

/** Admin panel access: owner or admin. */
export async function requireAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const profile = await getProfileForUser(ctx, userId);

  if (!profile || !isStaffRole(profile.role)) {
    throw new Error("Unauthorized");
  }

  return profile;
}

/** Role management: owner only. */
export async function requireOwner(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const profile = await getProfileForUser(ctx, userId);

  if (!profile || !isOwnerRole(profile.role)) {
    throw new Error("Only the owner can manage admin roles.");
  }

  return profile;
}

export { hasPaidAccess };

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
    throw new Error("This account is not authorized to claim the owner role.");
  }

  if (!secretsMatch(secret, expectedSecret)) {
    throw new Error("Invalid bootstrap secret.");
  }
}
