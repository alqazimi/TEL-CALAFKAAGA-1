"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectRealtime,
  joinConversation,
  leaveConversation,
  subscribeRealtime,
} from "../realtime/socket-client";
import { apiChat } from "./api";

export function useConversations(opts?: { list?: string; enabled?: boolean }) {
  const enabled = opts?.enabled !== false;
  const list = opts?.list;
  return useApiConversations(enabled ? list : undefined, enabled);
}

function useApiConversations(list: string | undefined, enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setApiData(
        await apiChat.getConversations(list ? { list } : undefined)
      );
    } catch {
      setApiData(null);
    }
  }, [enabled, list]);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    void refresh();
    connectRealtime();
    return subscribeRealtime("conversation:updated", () => {
      void refresh();
    });
  }, [refresh, enabled]);
  return apiData;
}

export function useMessages(conversationId: string | undefined) {
  return useApiMessages(conversationId);
}

function useApiMessages(conversationId: string | undefined) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  const refresh = useCallback(async () => {
    if (!conversationId) return;
    try {
      setApiData(await apiChat.getMessages(conversationId));
    } catch {
      setApiData(null);
    }
  }, [conversationId]);
  useEffect(() => {
    if (!conversationId) return;
    void refresh();
    connectRealtime();
    joinConversation(conversationId);
    const unsub = subscribeRealtime("message:new", () => {
      void refresh();
    });
    return () => {
      unsub();
      leaveConversation(conversationId);
    };
  }, [conversationId, refresh]);
  return apiData;
}

export function useSendMessage() {
  return useCallback(
    async (args: {
      conversationId: string;
      message?: string;
      imageMediaId?: string;
      imageId?: string;
      storageId?: string;
      idempotencyKey?: string;
    }) =>
      apiChat.sendMessage(args.conversationId, {
        message: args.message,
        imageMediaId: args.imageMediaId ?? args.imageId ?? args.storageId,
        idempotencyKey: args.idempotencyKey,
      }),
    []
  );
}

/** Upload a chat attachment via the Nest chat adapter. */
export function useUploadChatImage() {
  return useCallback(
    async (conversationId: string, file: File) =>
      apiChat.uploadChatImage(conversationId, file),
    []
  );
}

export function useMarkAsRead() {
  return useCallback(async (args: { conversationId: string } | string) => {
    const id = typeof args === "string" ? args : args.conversationId;
    return apiChat.markAsRead(id);
  }, []);
}

export function useSetTyping() {
  return useCallback(
    async (args: {
      conversationId: string;
      typing?: boolean;
      isTyping?: boolean;
    }) =>
      apiChat.setTyping(
        args.conversationId,
        args.typing ?? args.isTyping ?? false
      ),
    []
  );
}

export function useTypingStatus(conversationId: string | undefined) {
  return useApiTyping(conversationId);
}

function useApiTyping(conversationId: string | undefined) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    const poll = async () => {
      const d = await apiChat.getTypingStatus(conversationId);
      if (!cancelled) setApiData(d);
    };
    void poll();
    const unsub = subscribeRealtime("typing:update", () => {
      void poll();
    });
    const t = setInterval(() => void poll(), 5_000);
    return () => {
      cancelled = true;
      unsub();
      clearInterval(t);
    };
  }, [conversationId]);
  return apiData;
}
