import { isApiProvider } from "../provider";
import { wrapWithShadowReads } from "../shadow";
import { apiPreferences } from "./api";
import { convexPreferences } from "./convex";
import type { PreferencesAdapter } from "./types";

export type { PreferencesAdapter } from "./types";
export { PREFERENCES_METHOD_NAMES } from "./types";
export { apiPreferences } from "./api";

const SHADOW_READS = [
  "getPreferences",
] as const satisfies readonly (keyof PreferencesAdapter)[];

export function getPreferencesAdapter(): PreferencesAdapter {
  if (isApiProvider()) return apiPreferences;
  return wrapWithShadowReads(convexPreferences, apiPreferences, [
    ...SHADOW_READS,
  ]);
}

export const preferences = new Proxy({} as PreferencesAdapter, {
  get(_t, prop: string) {
    const adapter = getPreferencesAdapter();
    const value = adapter[prop as keyof PreferencesAdapter];
    return typeof value === "function" ? value.bind(adapter) : value;
  },
});
