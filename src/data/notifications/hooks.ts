"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSafeQuery } from "@/lib/use-safe-query";
import { isApiProvider } from "../provider";
import {
  connectRealtime,
  subscribeRealtime,
} from "../realtime/socket-client";
import { getNotificationsAdapter } from "./index";

export function useNotificationsList() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiNotificationsList();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(api.notifications.getNotifications, {});
}

function useApiNotificationsList() {
  const [apiData, setApiData] = useState<unknown>(undefined);
  const refresh = useCallback(async () => {
    setApiData(await getNotificationsAdapter().list());
  }, []);
  useEffect(() => {
    void refresh();
    connectRealtime();
    return subscribeRealtime("notification:new", () => {
      void refresh();
    });
  }, [refresh]);
  return apiData;
}

export function useUnreadCount() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiUnreadCount();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(api.notifications.getUnreadCount, {});
}

function useApiUnreadCount() {
  const [apiData, setApiData] = useState<unknown>(undefined);
  const refresh = useCallback(async () => {
    setApiData(await getNotificationsAdapter().unreadCount());
  }, []);
  useEffect(() => {
    void refresh();
    connectRealtime();
    const unsubN = subscribeRealtime("notification:new", () => void refresh());
    const unsubU = subscribeRealtime("unread:update", () => void refresh());
    return () => {
      unsubN();
      unsubU();
    };
  }, [refresh]);
  return apiData;
}

export function useMemberReminders() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiReminders();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(api.notifications.getMemberReminders, {});
}

function useApiReminders() {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    let cancelled = false;
    void getNotificationsAdapter()
      .getMemberReminders()
      .then((d) => {
        if (!cancelled) setApiData(d);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return apiData;
}

export function useMarkNotificationRead() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: { notificationId: string } | string) => {
        const id =
          typeof args === "string" ? args : args.notificationId;
        return getNotificationsAdapter().markAsRead(id);
      },
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.notifications.markAsRead);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: { notificationId: string } | string) => {
      const id = typeof args === "string" ? args : args.notificationId;
      return mut({ notificationId: id } as never);
    },
    [mut]
  );
}

export function useMarkAllNotificationsRead() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async () => getNotificationsAdapter().markAllAsRead(),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.notifications.markAllAsRead);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(async () => mut({}), [mut]);
}

export function useMarkNotificationsRead() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (ids: string[]) =>
        getNotificationsAdapter().markNotificationsRead(ids),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.notifications.markNotificationsRead);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (ids: string[]) => mut({ ids } as never),
    [mut]
  );
}
