import { isApiProvider } from "../provider";
import { wrapWithShadowReads } from "../shadow";
import { apiAuth } from "./api";
import { convexAuth } from "./convex";
import type { AuthAdapter } from "./types";

export type { AuthAdapter, LoginResult } from "./types";
export { AUTH_METHOD_NAMES } from "./types";

const SHADOW_READS = [
  "getSession",
  "getCurrentUser",
  "bootstrapMe",
] as const satisfies readonly (keyof AuthAdapter)[];

export function getAuthAdapter(): AuthAdapter {
  if (isApiProvider()) return apiAuth;
  return wrapWithShadowReads(convexAuth, apiAuth, [...SHADOW_READS]);
}

export const auth = new Proxy({} as AuthAdapter, {
  get(_t, prop: string) {
    const adapter = getAuthAdapter();
    const value = adapter[prop as keyof AuthAdapter];
    return typeof value === "function" ? value.bind(adapter) : value;
  },
});
