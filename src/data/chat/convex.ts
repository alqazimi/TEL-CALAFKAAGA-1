import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import { track } from "../telemetry";
import type { ChatAdapter } from "./types";

export const convexChat: ChatAdapter = {
  async getConversations(opts) {
    const client = getConvexClient();
    return client.query(
      api.messages.getConversations,
      (opts?.list ? { list: opts.list } : {}) as never
    );
  },
  async getMessages(conversationId) {
    const client = getConvexClient();
    return client.query(api.messages.getMessages, {
      conversationId,
    } as never);
  },
  async sendMessage(conversationId, body) {
    try {
      const client = getConvexClient();
      return await client.mutation(api.messages.sendMessage, {
        conversationId,
        ...body,
      } as never);
    } catch (e) {
      track("message_failure");
      throw e;
    }
  },
  async markAsRead(conversationId) {
    const client = getConvexClient();
    return client.mutation(api.messages.markAsRead, {
      conversationId,
    } as never);
  },
  async setTyping(conversationId, typing) {
    const client = getConvexClient();
    return client.mutation(api.messages.setTyping, {
      conversationId,
      typing,
    } as never);
  },
  async getTypingStatus(conversationId) {
    const client = getConvexClient();
    return client.query(api.messages.getTypingStatus, {
      conversationId,
    } as never);
  },
};
