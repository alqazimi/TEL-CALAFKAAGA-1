import { apiClient } from "../api-client";
import type { NotificationsAdapter } from "./types";

export const apiNotifications: NotificationsAdapter = {
  async list(opts) {
    const params = new URLSearchParams();
    if (opts?.cursor) params.set("cursor", opts.cursor);
    if (opts?.limit) params.set("limit", String(opts.limit));
    const q = params.toString();
    return apiClient.get(`/notifications${q ? `?${q}` : ""}`);
  },
  async unreadCount() {
    return apiClient.get("/notifications/unread-count");
  },
  async markAsRead(id) {
    return apiClient.post(`/notifications/${encodeURIComponent(id)}/read`, {});
  },
  async markAllAsRead() {
    return apiClient.post("/notifications/read-all", {});
  },
  async markNotificationsRead(ids) {
    return apiClient.post("/notifications/read", { ids });
  },
  async getMemberReminders() {
    // Nest may fold reminders into notifications list; fallback empty
    try {
      return await apiClient.get("/notifications?reminders=1");
    } catch {
      return [];
    }
  },
};
