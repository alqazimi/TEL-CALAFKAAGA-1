import { getShadowConfig, shouldSample, type ShadowConfig } from "./config";
import { recordShadowEvent } from "./metrics";
import { diffNormalized, normalizeForShadow } from "./normalize";

export type ShadowRunOpts = {
  endpoint: string;
  primary: unknown;
  fetchShadow: () => Promise<unknown>;
  config?: ShadowConfig;
  now?: () => number;
};

/**
 * Fire-and-forget shadow compare. Always returns void; never throws to caller.
 */
export function scheduleShadowRead(opts: ShadowRunOpts): void {
  void runShadowRead(opts).catch(() => {
    /* never surface */
  });
}

export async function runShadowRead(opts: ShadowRunOpts): Promise<void> {
  const cfg = opts.config ?? getShadowConfig();
  if (!shouldSample(cfg)) {
    recordShadowEvent({
      endpoint: opts.endpoint,
      outcome: "skipped",
      latencyMs: 0,
    });
    return;
  }
  if (!cfg.apiBaseUrl) {
    recordShadowEvent({
      endpoint: opts.endpoint,
      outcome: "error",
      latencyMs: 0,
    });
    return;
  }

  const started = (opts.now ?? Date.now)();
  try {
    const shadow = await Promise.race([
      opts.fetchShadow(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("shadow_timeout")), cfg.timeoutMs)
      ),
    ]);
    const latencyMs = (opts.now ?? Date.now)() - started;
    const left = normalizeForShadow(opts.primary);
    const right = normalizeForShadow(shadow);
    const diffs = diffNormalized(left, right);
    if (diffs.length === 0) {
      recordShadowEvent({
        endpoint: opts.endpoint,
        outcome: "match",
        latencyMs,
      });
    } else {
      recordShadowEvent({
        endpoint: opts.endpoint,
        outcome: "mismatch",
        latencyMs,
        diffCount: diffs.length,
        diffPaths: diffs.map((d) => `${d.kind}:${d.path}`).slice(0, 20),
      });
    }
  } catch (e) {
    const latencyMs = (opts.now ?? Date.now)() - started;
    const msg = e instanceof Error ? e.message : "error";
    recordShadowEvent({
      endpoint: opts.endpoint,
      outcome: msg === "shadow_timeout" ? "timeout" : "error",
      latencyMs,
    });
  }
}

/**
 * Wrap a primary (Convex) adapter so listed read methods also shadow the API adapter.
 * Writes are never shadowed. Primary result is always returned first.
 */
export function wrapWithShadowReads<T extends object>(
  primary: T,
  shadow: T,
  readMethods: readonly (keyof T & string)[]
): T {
  const reads = new Set(readMethods);
  return new Proxy(primary, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function" || typeof prop !== "string" || !reads.has(prop as keyof T & string)) {
        return typeof value === "function" ? value.bind(target) : value;
      }
      return async (...args: unknown[]) => {
        const result = await (value as (...a: unknown[]) => Promise<unknown>).apply(
          target,
          args
        );
        const shadowFn = shadow[prop as keyof T];
        if (typeof shadowFn === "function") {
          scheduleShadowRead({
            endpoint: prop,
            primary: result,
            fetchShadow: () =>
              (shadowFn as (...a: unknown[]) => Promise<unknown>).apply(
                shadow,
                args
              ),
          });
        }
        return result;
      };
    },
  });
}
