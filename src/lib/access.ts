export type UserRole = "user" | "admin" | "owner";

export function isStaffRole(role?: string): role is "admin" | "owner" {
  return role === "admin" || role === "owner";
}

export function isOwnerRole(role?: string): role is "owner" {
  return role === "owner";
}

export function hasPaidAccess(
  profile: { hasPaid?: boolean; role?: string } | null | undefined
): boolean {
  if (!profile) return false;
  return !!profile.hasPaid || isStaffRole(profile.role);
}
