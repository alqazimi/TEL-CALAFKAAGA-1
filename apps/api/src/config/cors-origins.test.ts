import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveCorsOrigins } from "./cors-origins";

describe("resolveCorsOrigins", () => {
  it("merges CORS_ORIGINS and APP_URL", () => {
    const origins = resolveCorsOrigins({
      CORS_ORIGINS: "https://a.example, https://b.example/",
      APP_URL: "https://app.example",
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv);
    assert.deepEqual(origins.sort(), [
      "https://a.example",
      "https://app.example",
      "https://b.example",
    ].sort());
  });

  it("always includes helcalafkaaga production domains on Render", () => {
    const origins = resolveCorsOrigins({
      CORS_ORIGINS: "https://tel-calafkaaga-1-api-one.vercel.app",
      RENDER: "true",
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv);
    assert.ok(origins.includes("https://www.helcalafkaaga.com"));
    assert.ok(origins.includes("https://helcalafkaaga.com"));
    assert.ok(origins.includes("https://tel-calafkaaga-1-api-one.vercel.app"));
  });
});
