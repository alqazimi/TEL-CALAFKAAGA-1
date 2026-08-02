import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenException } from "@nestjs/common";
import {
  cookieSameSite,
  CsrfGuard,
  CSRF_COOKIE,
  SESSION_COOKIE,
} from "./csrf";

function mockContext(opts: {
  method?: string;
  path?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  const req = {
    method: opts.method ?? "POST",
    path: opts.path ?? "/profile/me",
    url: opts.path ?? "/profile/me",
    cookies: opts.cookies ?? {},
    headers: opts.headers ?? {},
  };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  };
}

describe("cookieSameSite (H5)", () => {
  it("defaults to none when secure (cross-site production)", () => {
    const prev = process.env.COOKIE_SAMESITE;
    delete process.env.COOKIE_SAMESITE;
    assert.equal(cookieSameSite(true), "none");
    process.env.COOKIE_SAMESITE = prev;
  });

  it("defaults to lax when not secure (local)", () => {
    const prev = process.env.COOKIE_SAMESITE;
    delete process.env.COOKIE_SAMESITE;
    assert.equal(cookieSameSite(false), "lax");
    process.env.COOKIE_SAMESITE = prev;
  });

  it("honors COOKIE_SAMESITE override", () => {
    const prev = process.env.COOKIE_SAMESITE;
    process.env.COOKIE_SAMESITE = "strict";
    assert.equal(cookieSameSite(true), "strict");
    process.env.COOKIE_SAMESITE = prev;
  });
});

describe("CsrfGuard (H5)", () => {
  const guard = new CsrfGuard();

  it("allows safe methods", () => {
    assert.equal(
      guard.canActivate(mockContext({ method: "GET" }) as never),
      true
    );
  });

  it("allows login without CSRF", () => {
    assert.equal(
      guard.canActivate(
        mockContext({ path: "/auth/login", method: "POST" }) as never
      ),
      true
    );
  });

  it("allows verify-email without CSRF (email-link flow)", () => {
    assert.equal(
      guard.canActivate(
        mockContext({ path: "/auth/verify-email", method: "POST" }) as never
      ),
      true
    );
  });

  it("allows Stripe webhook without CSRF", () => {
    assert.equal(
      guard.canActivate(
        mockContext({ path: "/webhooks/stripe", method: "POST" }) as never
      ),
      true
    );
  });

  it("allows cookie + matching CSRF header", () => {
    const token = "a".repeat(64);
    assert.equal(
      guard.canActivate(
        mockContext({
          cookies: { [SESSION_COOKIE]: "sess", [CSRF_COOKIE]: token },
          headers: { "x-csrf-token": token },
        }) as never
      ),
      true
    );
  });

  it("denies cookie without CSRF token", () => {
    assert.throws(
      () =>
        guard.canActivate(
          mockContext({
            cookies: { [SESSION_COOKIE]: "sess", [CSRF_COOKIE]: "abc" },
          }) as never
        ),
      ForbiddenException
    );
  });

  it("denies cookie with wrong CSRF token", () => {
    assert.throws(
      () =>
        guard.canActivate(
          mockContext({
            cookies: {
              [SESSION_COOKIE]: "sess",
              [CSRF_COOKIE]: "a".repeat(64),
            },
            headers: { "x-csrf-token": "b".repeat(64) },
          }) as never
        ),
      ForbiddenException
    );
  });

  it("does not skip CSRF when X-Session-Token is also present with cookie", () => {
    assert.throws(
      () =>
        guard.canActivate(
          mockContext({
            cookies: { [SESSION_COOKIE]: "sess", [CSRF_COOKIE]: "abc" },
            headers: { "x-session-token": "sess" },
          }) as never
        ),
      ForbiddenException
    );
  });

  it("allows header-only session without cookie (non-browser compat)", () => {
    assert.equal(
      guard.canActivate(
        mockContext({
          headers: { "x-session-token": "raw-token" },
        }) as never
      ),
      true
    );
  });

  it("malformed CSRF does not throw 500", () => {
    assert.throws(
      () =>
        guard.canActivate(
          mockContext({
            cookies: { [SESSION_COOKIE]: "sess", [CSRF_COOKIE]: "short" },
            headers: { "x-csrf-token": "also-short" },
          }) as never
        ),
      (err: unknown) => err instanceof ForbiddenException
    );
  });
});
