import type { AccessStateLike, SessionUser } from "../types";

export type LoginResult = {
  user: SessionUser;
  csrfToken?: string;
  /** Present in Nest API mode for cross-site auth (X-Session-Token). */
  sessionToken?: string;
};

export type AuthAdapter = {
  getSession(): Promise<SessionUser | null>;
  getCurrentUser(): Promise<SessionUser | null>;
  login(email: string, password: string): Promise<LoginResult>;
  register(email: string, password: string): Promise<LoginResult>;
  /** Explicit availability for register UI (inverted isEmailRegistered). */
  checkEmail(email: string): Promise<{ available: boolean }>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  forgotPassword(email: string): Promise<{ ok: boolean }>;
  resetPassword(token: string, newPassword: string): Promise<{ ok: boolean }>;
  changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ ok: boolean }>;
  bootstrapMe(): Promise<{
    user: SessionUser | null;
    accessState: AccessStateLike | null;
    csrfToken?: string;
  }>;
};

export const AUTH_METHOD_NAMES = [
  "getSession",
  "getCurrentUser",
  "login",
  "register",
  "checkEmail",
  "logout",
  "logoutAll",
  "forgotPassword",
  "resetPassword",
  "changePassword",
  "bootstrapMe",
] as const;
