import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { NotificationsAdapter } from "./types";

export const convexNotifications: NotificationsAdapter = {
  async list() {
    const client = getConvexClient();
    return client.query(api.notifications.getNotifications, {});
  },
  async unreadCount() {
    const client = getConvexClient();
    return client.query(api.notifications.getUnreadCount, {});
  },
  async markAsRead(id) {
    const client = getConvexClient();
    return client.mutation(api.notifications.markAsRead, {
      notificationId: id,
    } as never);
  },
  async markAllAsRead() {
    const client = getConvexClient();
    return client.mutation(api.notifications.markAllAsRead, {});
  },
  async markNotificationsRead(ids) {
    const client = getConvexClient();
    return client.mutation(api.notifications.markNotificationsRead, {
      ids,
    } as never);
  },
  async getMemberReminders() {
    const client = getConvexClient();
    return client.query(api.notifications.getMemberReminders, {});
  },
};
