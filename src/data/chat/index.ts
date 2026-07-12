import { isApiProvider } from "../provider";
import { wrapWithShadowReads } from "../shadow";
import { apiChat } from "./api";
import { convexChat } from "./convex";
import type { ChatAdapter } from "./types";

export type { ChatAdapter } from "./types";
export { CHAT_METHOD_NAMES } from "./types";

const SHADOW_READS = [
  "getConversations",
  "getMessages",
  "getTypingStatus",
] as const satisfies readonly (keyof ChatAdapter)[];

export function getChatAdapter(): ChatAdapter {
  if (isApiProvider()) return apiChat;
  return wrapWithShadowReads(convexChat, apiChat, [...SHADOW_READS]);
}

export const chat = new Proxy({} as ChatAdapter, {
  get(_t, prop: string) {
    const adapter = getChatAdapter();
    const value = adapter[prop as keyof ChatAdapter];
    return typeof value === "function" ? value.bind(adapter) : value;
  },
});
