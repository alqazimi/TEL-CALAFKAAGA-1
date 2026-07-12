import { apiClient } from "../api-client";
import { track } from "../telemetry";
import type { ChatAdapter } from "./types";

export const apiChat: ChatAdapter = {
  async getConversations(opts) {
    const list = opts?.list;
    const q =
      list && ["active", "new", "archived"].includes(list)
        ? `?list=${encodeURIComponent(list)}`
        : "";
    const res = await apiClient.get<{ items?: unknown } | unknown>(
      `/conversations${q}`
    );
    // Nest returns { items }; Convex returns array — normalize for UI.
    if (res && typeof res === "object" && "items" in res && Array.isArray(res.items)) {
      return res.items;
    }
    return res;
  },
  async getMessages(conversationId, opts) {
    const params = new URLSearchParams();
    if (opts?.cursor) params.set("cursor", opts.cursor);
    if (opts?.limit) params.set("limit", String(opts.limit));
    const q = params.toString();
    return apiClient.get(
      `/conversations/${encodeURIComponent(conversationId)}/messages${q ? `?${q}` : ""}`
    );
  },
  async sendMessage(conversationId, body) {
    try {
      return await apiClient.post(
        `/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          message: body.message,
          imageMediaId: body.imageMediaId,
        },
        { idempotencyKey: body.idempotencyKey }
      );
    } catch (e) {
      track("message_failure");
      throw e;
    }
  },
  async markAsRead(conversationId) {
    return apiClient.post(
      `/conversations/${encodeURIComponent(conversationId)}/read`,
      {}
    );
  },
  async setTyping(conversationId, typing) {
    return apiClient.post(
      `/conversations/${encodeURIComponent(conversationId)}/typing`,
      { typing }
    );
  },
  async getTypingStatus(conversationId) {
    return apiClient.get(
      `/conversations/${encodeURIComponent(conversationId)}/typing`
    );
  },
};
