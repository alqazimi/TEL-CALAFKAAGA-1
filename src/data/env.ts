import {
  getBackendProvider,
  isApiProvider,
  validateBackendProvider,
} from "./provider";

export type FrontendEnvReport = {
  provider: "convex" | "api";
  ok: boolean;
  errors: string[];
};

/**
 * Validate frontend env for the active backend provider.
 * Call from Providers on mount (client) — never throws into the tree;
 * returns a report and logs in development.
 */
export function validateFrontendEnv(): FrontendEnvReport {
  const errors: string[] = [];
  let provider: "convex" | "api" = "convex";

  try {
    provider = validateBackendProvider();
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    provider = getBackendProvider();
  }

  if (isApiProvider() || provider === "api") {
    if (!(process.env.NEXT_PUBLIC_API_URL ?? "").trim()) {
      errors.push(
        "NEXT_PUBLIC_API_URL is required when NEXT_PUBLIC_BACKEND_PROVIDER=api"
      );
    }
    const socket =
      process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL;
    if (!(socket ?? "").trim()) {
      errors.push(
        "NEXT_PUBLIC_SOCKET_URL (or NEXT_PUBLIC_API_URL) is required when NEXT_PUBLIC_BACKEND_PROVIDER=api"
      );
    }
  } else {
    // Convex mode — URL preferred but build placeholder exists; warn only.
    if (!(process.env.NEXT_PUBLIC_CONVEX_URL ?? "").trim()) {
      if (process.env.NODE_ENV === "development") {
        errors.push("Missing NEXT_PUBLIC_CONVEX_URL in local env.");
      }
    }
  }

  return { provider, ok: errors.length === 0, errors };
}
