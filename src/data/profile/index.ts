import { isApiProvider } from "../provider";
import { wrapWithShadowReads } from "../shadow";
import { apiProfile } from "./api";
import { convexProfile } from "./convex";
import type { ProfileAdapter } from "./types";

export type { ProfileAdapter } from "./types";
export { PROFILE_METHOD_NAMES } from "./types";

const SHADOW_READS = [
  "getProfile",
  "getAccessState",
] as const satisfies readonly (keyof ProfileAdapter)[];

export function getProfileAdapter(): ProfileAdapter {
  if (isApiProvider()) return apiProfile;
  return wrapWithShadowReads(convexProfile, apiProfile, [...SHADOW_READS]);
}

export const profile = new Proxy({} as ProfileAdapter, {
  get(_t, prop: string) {
    const adapter = getProfileAdapter();
    const value = adapter[prop as keyof ProfileAdapter];
    return typeof value === "function" ? value.bind(adapter) : value;
  },
});
