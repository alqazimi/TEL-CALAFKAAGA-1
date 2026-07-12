import { isApiProvider } from "../provider";
import { wrapWithShadowReads } from "../shadow";
import { apiMatching } from "./api";
import { convexMatching } from "./convex";
import type { MatchingAdapter } from "./types";

export type { MatchingAdapter } from "./types";
export { MATCHING_METHOD_NAMES } from "./types";

const SHADOW_READS = [
  "getMatches",
  "getMyMatches",
  "getMatchLists",
  "getCompatibilityBreakdown",
] as const satisfies readonly (keyof MatchingAdapter)[];

export function getMatchingAdapter(): MatchingAdapter {
  if (isApiProvider()) return apiMatching;
  return wrapWithShadowReads(convexMatching, apiMatching, [...SHADOW_READS]);
}

export const matching = new Proxy({} as MatchingAdapter, {
  get(_t, prop: string) {
    const adapter = getMatchingAdapter();
    const value = adapter[prop as keyof MatchingAdapter];
    return typeof value === "function" ? value.bind(adapter) : value;
  },
});
