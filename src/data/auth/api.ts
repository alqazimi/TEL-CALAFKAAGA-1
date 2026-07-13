import { apiClient } from "../api-client";
import { disconnectRealtime } from "../realtime/socket-client";
import { track } from "../telemetry";
import type { AccessStateLike, SessionUser } from "../types";
import type { AuthAdapter, LoginResult } from "./types";

type NestAuthUser = {
  id: string;
  email?: string | null;
  emailNormalized?: string | null;
  role?: string;
  banned?: boolean;
  hasProfile?: boolean;
  hasPaid?: boolean;
  mustResetPassword?: boolean;
  profile?: Record<string, unknown> | null;
  [key: string]: unknown;
};

type MeResponse = {
  user: NestAuthUser;
  accessState?: AccessStateLike;
  csrfToken?: string;
};

/**
 * Nest returns a flat auth user (`role` / `hasPaid` on the root).
 * The UI expects Convex-shaped `user.profile.role` for staff routing.
 */
function toSessionUser(raw: NestAuthUser | null | undefined): SessionUser | null {
  if (!raw?.id) return null;
  const nested = (raw.profile as Record<string, unknown> | null | undefined) ?? null;
  const role =
    (typeof nested?.role === "string" ? nested.role : undefined) ??
    (typeof raw.role === "string" ? raw.role : "user");
  const hasPaid =
    typeof nested?.hasPaid === "boolean"
      ? nested.hasPaid
      : Boolean(raw.hasPaid);
  const banned =
    typeof nested?.banned === "boolean" ? nested.banned : Boolean(raw.banned);

  return {
    ...raw,
    id: raw.id,
    email: raw.email ?? null,
    role,
    hasPaid,
    banned,
    profile: {
      ...(nested ?? {}),
      role,
      hasPaid,
      banned,
    },
  };
}

function toLoginResult(
  res: (LoginResult & { csrfToken?: string; user?: NestAuthUser }) | null
): LoginResult {
  return {
    ...res,
    user: toSessionUser(res?.user as NestAuthUser) as SessionUser,
    csrfToken: res?.csrfToken,
  };
}

export const apiAuth: AuthAdapter = {
  async getSession() {
    try {
      const res = await apiClient.get<MeResponse>("/auth/me");
      return toSessionUser(res?.user);
    } catch {
      return null;
    }
  },

  async getCurrentUser() {
    return this.getSession();
  },

  async login(email, password) {
    try {
      const res = await apiClient.post<LoginResult & { csrfToken?: string }>(
        "/auth/login",
        { email, password }
      );
      return toLoginResult(res);
    } catch (e) {
      track("login_failure", { status: (e as { status?: number })?.status });
      throw e;
    }
  },

  async register(email, password) {
    try {
      const res = await apiClient.post<LoginResult & { csrfToken?: string }>(
        "/auth/register",
        { email, password }
      );
      return toLoginResult(res);
    } catch (e) {
      track("register_failure", { status: (e as { status?: number })?.status });
      throw e;
    }
  },

  async checkEmail(email) {
    return apiClient.post<{ available: boolean }>("/auth/register/check-email", {
      email,
    });
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout", {});
    } finally {
      disconnectRealtime();
    }
  },

  async logoutAll() {
    try {
      await apiClient.post("/auth/logout-all", {});
    } finally {
      disconnectRealtime();
    }
  },

  async forgotPassword(email) {
    await apiClient.post("/auth/forgot-password", { email });
    return { ok: true };
  },

  async resetPassword(token, newPassword) {
    await apiClient.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return { ok: true };
  },

  async changePassword(currentPassword, newPassword) {
    return apiClient.post<{ ok: boolean }>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  async bootstrapMe() {
    try {
      const res = await apiClient.get<MeResponse>("/auth/me");
      return {
        user: toSessionUser(res?.user),
        accessState: res?.accessState ?? null,
        csrfToken: res?.csrfToken,
      };
    } catch {
      return { user: null, accessState: null };
    }
  },
};
