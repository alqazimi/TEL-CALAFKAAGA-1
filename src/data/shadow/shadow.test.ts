import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { shouldSample, type ShadowConfig } from "./config";
import { diffNormalized, normalizeForShadow } from "./normalize";
import {
  getShadowMetrics,
  resetShadowMetrics,
} from "./metrics";
import { runShadowRead, wrapWithShadowReads } from "./run";

function cfg(over: Partial<ShadowConfig> = {}): ShadowConfig {
  return {
    enabled: true,
    samplePercent: 100,
    timeoutMs: 200,
    apiBaseUrl: "http://127.0.0.1:4001",
    ...over,
  };
}

describe("shadow config sampling", () => {
  it("disabled never samples", () => {
    assert.equal(shouldSample(cfg({ enabled: false })), false);
  });
  it("0% never samples", () => {
    assert.equal(shouldSample(cfg({ samplePercent: 0 })), false);
  });
  it("100% always samples", () => {
    assert.equal(shouldSample(cfg({ samplePercent: 100 }), () => 0.99), true);
  });
  it("respects random threshold", () => {
    assert.equal(
      shouldSample(cfg({ samplePercent: 10 }), () => 0.05),
      true
    );
    assert.equal(
      shouldSample(cfg({ samplePercent: 10 }), () => 0.5),
      false
    );
  });
});

describe("shadow normalize + diff", () => {
  it("matching normalized shapes", () => {
    const a = normalizeForShadow({
      id: "1",
      email: "a@b.com",
      updatedAt: "2026-01-01T00:00:00.000Z",
      photoUrl: "https://minio/x",
      score: 12,
    });
    const b = normalizeForShadow({
      id: "1",
      email: "other@b.com",
      updatedAt: "2026-07-01T00:00:00.000Z",
      photoUrl: "https://other/y",
      score: 12,
    });
    assert.deepEqual(diffNormalized(a, b), []);
  });

  it("reports value mismatches on stable fields", () => {
    const a = normalizeForShadow({ score: 1 });
    const b = normalizeForShadow({ score: 2 });
    const diffs = diffNormalized(a, b);
    assert.ok(diffs.some((d) => d.path.includes("score")));
  });
});

describe("shadow run outcomes", () => {
  beforeEach(() => resetShadowMetrics());

  it("records match", async () => {
    await runShadowRead({
      endpoint: "profile",
      primary: { score: 1 },
      fetchShadow: async () => ({ score: 1 }),
      config: cfg(),
    });
    const m = getShadowMetrics();
    assert.equal(m.match, 1);
  });

  it("records mismatch without leaking values", async () => {
    await runShadowRead({
      endpoint: "profile",
      primary: { score: 1 },
      fetchShadow: async () => ({ score: 9 }),
      config: cfg(),
    });
    const m = getShadowMetrics();
    assert.equal(m.mismatch, 1);
    const paths = JSON.stringify(m.recent);
    assert.ok(!paths.includes("password"));
    assert.ok(paths.includes("score") || paths.includes("value"));
  });

  it("records timeout", async () => {
    await runShadowRead({
      endpoint: "slow",
      primary: {},
      fetchShadow: () => new Promise((r) => setTimeout(r, 500)),
      config: cfg({ timeoutMs: 50 }),
    });
    assert.equal(getShadowMetrics().timeout, 1);
  });

  it("records error", async () => {
    await runShadowRead({
      endpoint: "err",
      primary: {},
      fetchShadow: async () => {
        throw new Error("boom");
      },
      config: cfg(),
    });
    assert.equal(getShadowMetrics().error, 1);
  });

  it("shadow disabled → skipped", async () => {
    await runShadowRead({
      endpoint: "x",
      primary: {},
      fetchShadow: async () => {
        throw new Error("should not run");
      },
      config: cfg({ enabled: false }),
    });
    assert.equal(getShadowMetrics().skipped, 1);
  });

  it("Convex primary unaffected when shadow fails", async () => {
    const primary = {
      async getProfile() {
        return { ok: true };
      },
    };
    const shadow = {
      async getProfile() {
        throw new Error("api down");
      },
    };
    const wrapped = wrapWithShadowReads(primary, shadow, ["getProfile"]);
    const result = await wrapped.getProfile();
    assert.deepEqual(result, { ok: true });
    // allow microtask
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(getShadowMetrics().error + getShadowMetrics().samples >= 1);
  });
});
