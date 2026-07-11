import type { QueryCtx } from "../_generated/server";

/** Normalize email for auth lookup and uniqueness checks. */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * True if this email already owns a user or password auth account.
 * Checks the normalized form used for all new signups.
 */
export async function isEmailTaken(
  ctx: QueryCtx,
  email: string
): Promise<boolean> {
  const normalized = normalizeAuthEmail(email);
  if (!normalized) return false;

  const existingUser = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", normalized))
    .first();
  if (existingUser) return true;

  const existingAccount = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "password").eq("providerAccountId", normalized)
    )
    .unique();

  return existingAccount !== null;
}
