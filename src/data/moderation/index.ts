import { isApiProvider } from "../provider";
import { apiModeration } from "./api";
import { convexModeration } from "./convex";
import type { ModerationAdapter } from "./types";

export type { ModerationAdapter } from "./types";
export { MODERATION_METHOD_NAMES } from "./types";

export function getModerationAdapter(): ModerationAdapter {
  return isApiProvider() ? apiModeration : convexModeration;
}

export const moderation = new Proxy({} as ModerationAdapter, {
  get(_t, prop: string) {
    const adapter = getModerationAdapter();
    const value = adapter[prop as keyof ModerationAdapter];
    return typeof value === "function" ? value.bind(adapter) : value;
  },
});
