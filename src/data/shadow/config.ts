/**
 * Dual-read shadow comparison (Phase 12).
 *
 * Convex remains user-facing. When enabled, equivalent API reads run in the
 * background and are compared. Shadow failures never affect Convex responses.
 *
 * Env (frontend):
 *   NEXT_PUBLIC_SHADOW_READS_ENABLED=true|false  (default false)
 *   NEXT_PUBLIC_SHADOW_SAMPLE_PERCENT=0-100      (default 10)
 *   NEXT_PUBLIC_SHADOW_TIMEOUT_MS               (default 800)
 *   NEXT_PUBLIC_API_URL                         (shadow target; required when enabled)
 */

export type ShadowConfig = {
  enabled: boolean;
  samplePercent: number;
  timeoutMs: number;
  apiBaseUrl: string;
};

export function getShadowConfig(): ShadowConfig {
  const enabled =
    (process.env.NEXT_PUBLIC_SHADOW_READS_ENABLED ?? "false")
      .trim()
      .toLowerCase() === "true";
  const samplePercent = clampInt(
    process.env.NEXT_PUBLIC_SHADOW_SAMPLE_PERCENT ?? "10",
    0,
    100,
    10
  );
  const timeoutMs = clampInt(
    process.env.NEXT_PUBLIC_SHADOW_TIMEOUT_MS ?? "800",
    50,
    5000,
    800
  );
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  return { enabled, samplePercent, timeoutMs, apiBaseUrl };
}

function clampInt(
  raw: string,
  min: number,
  max: number,
  fallback: number
): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function shouldSample(cfg: ShadowConfig, rand = Math.random): boolean {
  if (!cfg.enabled) return false;
  if (cfg.samplePercent <= 0) return false;
  if (cfg.samplePercent >= 100) return true;
  return rand() * 100 < cfg.samplePercent;
}
