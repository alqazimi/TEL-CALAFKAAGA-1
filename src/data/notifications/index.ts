import { isApiProvider } from "../provider";
import { wrapWithShadowReads } from "../shadow";
import { apiNotifications } from "./api";
import { convexNotifications } from "./convex";
import type { NotificationsAdapter } from "./types";

export type { NotificationsAdapter } from "./types";
export { NOTIFICATIONS_METHOD_NAMES } from "./types";

const SHADOW_READS = [
  "list",
  "unreadCount",
  "getMemberReminders",
] as const satisfies readonly (keyof NotificationsAdapter)[];

export function getNotificationsAdapter(): NotificationsAdapter {
  if (isApiProvider()) return apiNotifications;
  return wrapWithShadowReads(convexNotifications, apiNotifications, [
    ...SHADOW_READS,
  ]);
}

export const notifications = new Proxy({} as NotificationsAdapter, {
  get(_t, prop: string) {
    const adapter = getNotificationsAdapter();
    const value = adapter[prop as keyof NotificationsAdapter];
    return typeof value === "function" ? value.bind(adapter) : value;
  },
});
