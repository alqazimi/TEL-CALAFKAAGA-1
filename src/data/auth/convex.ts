import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { SessionUser } from "../types";
import type { AuthAdapter } from "./types";

function toSessionUser(user: unknown): SessionUser | null {
  if (!user || typeof user !== "object") return null;
  const u = user as Record<string, unknown>;
  const id = String(u.id ?? u.userId ?? "");
  if (!id) return null;
  return {
    id,
    email: (u.email as string | null | undefined) ?? null,
    profile: (u.profile as Record<string, unknown> | null | undefined) ?? null,
    ...u,
  };
}

/**
 * Convex auth adapter — session identity is owned by Convex Auth.
 * Imperative login/register/logout require AuthActions from React context;
 * use `useAuthAdapter()` / ApiAuthProvider bridge for those.
 */
export const convexAuth: AuthAdapter = {
  async getSession() {
    try {
      const client = getConvexClient();
      const user = await client.query(api.users.currentUser, {});
      return toSessionUser(user);
    } catch {
      return null;
    }
  },

  async getCurrentUser() {
    return this.getSession();
  },

  async login() {
    throw new Error(
      "convexAuth.login requires useAuthActions — use auth hooks / page wiring"
    );
  },

  async register() {
    throw new Error(
      "convexAuth.register requires useAuthActions — use auth hooks / page wiring"
    );
  },

  async checkEmail(email) {
    const client = getConvexClient();
    const taken = await client.query(api.users.isEmailRegistered, { email });
    return { available: !taken };
  },

  async logout() {
    throw new Error(
      "convexAuth.logout requires useAuthActions — use useSignOut / auth hooks"
    );
  },

  async logoutAll() {
    throw new Error(
      "convexAuth.logoutAll requires useAuthActions — use auth hooks"
    );
  },

  async forgotPassword() {
    throw new Error(
      "convexAuth.forgotPassword requires useAuthActions reset flow"
    );
  },

  async resetPassword() {
    throw new Error(
      "convexAuth.resetPassword requires useAuthActions reset-verification flow"
    );
  },

  async changePassword(currentPassword, newPassword) {
    const client = getConvexClient();
    await client.action(api.account.changePassword, {
      currentPassword,
      newPassword,
    });
    return { ok: true };
  },

  async bootstrapMe() {
    try {
      const client = getConvexClient();
      const user = await client.query(api.users.currentUser, {});
      const session = toSessionUser(user);
      return {
        user: session,
        accessState: (session?.profile as Record<string, unknown> | null) ?? null,
      };
    } catch {
      return { user: null, accessState: null };
    }
  },
};
