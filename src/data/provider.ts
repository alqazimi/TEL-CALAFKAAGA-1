export type BackendProvider = "convex" | "api";

const VALID: ReadonlySet<string> = new Set(["convex", "api"]);

/**
 * Backend provider — MUST be explicit via NEXT_PUBLIC_BACKEND_PROVIDER.
 * Defaults to "convex". Production stays on Convex unless set to "api".
 * Never auto-infers to "api".
 */
export function getBackendProvider(): BackendProvider {
  const raw = (process.env.NEXT_PUBLIC_BACKEND_PROVIDER ?? "convex")
    .trim()
    .toLowerCase();
  if (!raw) return "convex";
  if (raw === "convex" || raw === "api") return raw;
  // Soft default for runtime: treat unknown as convex so production never flips.
  return "convex";
}

/** Strict validation used by validateFrontendEnv — throws on invalid values. */
export function validateBackendProvider(): BackendProvider {
  const raw = (process.env.NEXT_PUBLIC_BACKEND_PROVIDER ?? "convex")
    .trim()
    .toLowerCase();
  if (!VALID.has(raw)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_BACKEND_PROVIDER="${process.env.NEXT_PUBLIC_BACKEND_PROVIDER}". Expected "convex" | "api".`
    );
  }
  return raw as BackendProvider;
}

export function isApiProvider(): boolean {
  return getBackendProvider() === "api";
}

export function isConvexProvider(): boolean {
  return getBackendProvider() === "convex";
}

export function getApiBaseUrl(): string {
  if (!isApiProvider()) {
    return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  }
  const url = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required when NEXT_PUBLIC_BACKEND_PROVIDER=api"
    );
  }
  return url;
}

export function getSocketUrl(): string {
  if (!isApiProvider()) {
    return (
      process.env.NEXT_PUBLIC_SOCKET_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      ""
    ).replace(/\/$/, "");
  }
  const url = (
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  )
    .trim()
    .replace(/\/$/, "");
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SOCKET_URL (or NEXT_PUBLIC_API_URL) is required when NEXT_PUBLIC_BACKEND_PROVIDER=api"
    );
  }
  return url;
}
