export type BackendProvider = "api";

/**
 * Backend provider — Nest API + Postgres is the only backend.
 */
export function getBackendProvider(): BackendProvider {
  return "api";
}

/** Kept for callers; always returns "api". */
export function validateBackendProvider(): BackendProvider {
  return "api";
}

export function isApiProvider(): boolean {
  return true;
}

export function getApiBaseUrl(): string {
  const url = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is required");
  }
  return url;
}

export function getSocketUrl(): string {
  const url = (
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  )
    .trim()
    .replace(/\/$/, "");
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SOCKET_URL (or NEXT_PUBLIC_API_URL) is required"
    );
  }
  return url;
}
