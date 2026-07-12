import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { generateToken, safeEqualHex } from "./crypto-util";

export const CSRF_COOKIE = "hel_csrf";
export const SESSION_COOKIE = "hel_session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method.toUpperCase())) return true;

    // Unauthenticated auth bootstrap endpoints skip CSRF
    const path = req.path || req.url || "";
    if (
      path.endsWith("/auth/login") ||
      path.endsWith("/auth/register") ||
      path.endsWith("/auth/register/check-email") ||
      path.endsWith("/auth/forgot-password") ||
      path.endsWith("/auth/reset-password")
    ) {
      return true;
    }

    // Only enforce when a session cookie is present
    const session = req.cookies?.[SESSION_COOKIE];
    if (!session) return true;

    const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
    const headerToken =
      (req.headers["x-csrf-token"] as string | undefined) ??
      (req.headers["x-xsrf-token"] as string | undefined);

    if (!cookieToken || !headerToken || !safeEqualHex(cookieToken, headerToken)) {
      throw new ForbiddenException("Invalid CSRF token");
    }
    return true;
  }
}

export function issueCsrfCookie(res: Response, secure: boolean, domain?: string) {
  const token = generateToken(24);
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    domain: domain || undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

export function setSessionCookie(
  res: Response,
  rawToken: string,
  opts: { secure: boolean; domain?: string; expiresAt: Date }
) {
  res.cookie(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: "lax",
    path: "/",
    domain: opts.domain || undefined,
    expires: opts.expiresAt,
  });
}

export function clearAuthCookies(
  res: Response,
  opts: { secure: boolean; domain?: string }
) {
  const base = {
    path: "/",
    domain: opts.domain || undefined,
    secure: opts.secure,
    sameSite: "lax" as const,
  };
  res.clearCookie(SESSION_COOKIE, { ...base, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...base, httpOnly: false });
}
