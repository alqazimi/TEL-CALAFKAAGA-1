export type ShadowOutcome =
  | "match"
  | "mismatch"
  | "timeout"
  | "error"
  | "skipped";

export type ShadowEvent = {
  endpoint: string;
  outcome: ShadowOutcome;
  latencyMs: number;
  diffCount?: number;
  /** Path-only diffs — never values. */
  diffPaths?: string[];
};

type Aggregate = {
  samples: number;
  match: number;
  mismatch: number;
  timeout: number;
  error: number;
  skipped: number;
  latencySumMs: number;
};

const agg: Aggregate = {
  samples: 0,
  match: 0,
  mismatch: 0,
  timeout: 0,
  error: 0,
  skipped: 0,
  latencySumMs: 0,
};

const recent: ShadowEvent[] = [];
const MAX_RECENT = 50;

export function recordShadowEvent(ev: ShadowEvent) {
  agg.samples += 1;
  agg[ev.outcome] += 1;
  agg.latencySumMs += ev.latencyMs;
  recent.push(ev);
  if (recent.length > MAX_RECENT) recent.shift();
}

export function getShadowMetrics() {
  return {
    ...agg,
    avgLatencyMs: agg.samples ? Math.round(agg.latencySumMs / agg.samples) : 0,
    recent: recent.map((e) => ({
      endpoint: e.endpoint,
      outcome: e.outcome,
      latencyMs: e.latencyMs,
      diffCount: e.diffCount,
      // paths only
      diffPaths: e.diffPaths,
    })),
  };
}

export function resetShadowMetrics() {
  agg.samples = 0;
  agg.match = 0;
  agg.mismatch = 0;
  agg.timeout = 0;
  agg.error = 0;
  agg.skipped = 0;
  agg.latencySumMs = 0;
  recent.length = 0;
}
