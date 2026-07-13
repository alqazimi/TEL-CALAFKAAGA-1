"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSafeQuery } from "@/lib/use-safe-query";
import { isApiProvider } from "../provider";
import {
  connectRealtime,
  joinConversation,
  leaveConversation,
  subscribeRealtime,
} from "../realtime/socket-client";
import { getChatAdapter } from "./index";

export function useConversations(opts?: { list?: string; enabled?: boolean }) {
  const enabled = opts?.enabled !== false;
  const list = opts?.list;
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiConversations(enabled ? list : undefined, enabled);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(
    api.messages.getConversations,
    enabled ? ((list ? { list } : {}) as never) : "skip"
  );
}

function useApiConversations(list: string | undefined, enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setApiData(
        await getChatAdapter().getConversations(list ? { list } : undefined)
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
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiMessages(conversationId);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(
    api.messages.getMessages,
    conversationId ? ({ conversationId } as never) : "skip"
  );
}

function useApiMessages(conversationId: string | undefined) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  const refresh = useCallback(async () => {
    if (!conversationId) return;
    try {
      setApiData(await getChatAdapter().getMessages(conversationId));
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
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: {
        conversationId: string;
        message?: string;
        imageMediaId?: string;
        imageId?: string;
        storageId?: string;
        idempotencyKey?: string;
      }) =>
        getChatAdapter().sendMessage(args.conversationId, {
          message: args.message,
          imageMediaId:
            args.imageMediaId ?? args.imageId ?? args.storageId,
          idempotencyKey: args.idempotencyKey,
        }),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.messages.sendMessage);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: Record<string, unknown>) => mut(args as never),
    [mut]
  );
}

export function useMarkAsRead() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: { conversationId: string } | string) => {
        const id =
          typeof args === "string" ? args : args.conversationId;
        return getChatAdapter().markAsRead(id);
      },
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.messages.markAsRead);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: { conversationId: string } | string) => {
      const id = typeof args === "string" ? args : args.conversationId;
      return mut({ conversationId: id } as never);
    },
    [mut]
  );
}

export function useSetTyping() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: {
        conversationId: string;
        typing?: boolean;
        isTyping?: boolean;
      }) =>
        getChatAdapter().setTyping(
          args.conversationId,
          args.typing ?? args.isTyping ?? false
        ),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.messages.setTyping);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: {
      conversationId: string;
      typing?: boolean;
      isTyping?: boolean;
    }) => mut(args as never),
    [mut]
  );
}

export function useTypingStatus(conversationId: string | undefined) {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiTyping(conversationId);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(
    api.messages.getTypingStatus,
    conversationId ? ({ conversationId } as never) : "skip"
  );
}

function useApiTyping(conversationId: string | undefined) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    const poll = async () => {
      const d = await getChatAdapter().getTypingStatus(conversationId);
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
