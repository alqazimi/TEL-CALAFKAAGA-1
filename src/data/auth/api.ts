import { apiClient } from "../api-client";
import { disconnectRealtime } from "../realtime/socket-client";
import { track } from "../telemetry";
import type { AccessStateLike, SessionUser } from "../types";
import type { AuthAdapter, LoginResult } from "./types";

type MeResponse = {
  user: SessionUser;
  accessState?: AccessStateLike;
  csrfToken?: string;
};

export const apiAuth: AuthAdapter = {
  async getSession() {
    try {
      const res = await apiClient.get<MeResponse>("/auth/me");
      return res?.user ?? null;
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
      return res;
    } catch (e) {
      track("login_failure", { status: (e as { status?: number })?.status });
      throw e;
    }
  },

  async register(email, password) {
    try {
      return await apiClient.post<LoginResult & { csrfToken?: string }>(
        "/auth/register",
        { email, password }
      );
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
        user: res?.user ?? null,
        accessState: res?.accessState ?? null,
        csrfToken: res?.csrfToken,
      };
    } catch {
      return { user: null, accessState: null };
    }
  },
};
