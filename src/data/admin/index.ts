import { isApiProvider } from "../provider";
import { wrapWithShadowReads } from "../shadow";
import { apiAdmin } from "./api";
import { convexAdmin } from "./convex";
import type { AdminAdapter } from "./types";

export type { AdminAdapter } from "./types";
export { ADMIN_TOP_METHOD_NAMES } from "./types";

const SHADOW_READS = [
  "stats",
  "analytics",
  "siteMetrics",
] as const satisfies readonly (keyof AdminAdapter)[];

export function getAdminAdapter(): AdminAdapter {
  if (isApiProvider()) return apiAdmin;
  return wrapWithShadowReads(convexAdmin, apiAdmin, [...SHADOW_READS]);
}

export const admin = new Proxy({} as AdminAdapter, {
  get(_t, prop: string) {
    const adapter = getAdminAdapter();
    const value = adapter[prop as keyof AdminAdapter];
    if (typeof value === "function") return value.bind(adapter);
    return value;
  },
});
