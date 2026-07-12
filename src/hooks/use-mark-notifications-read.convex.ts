"use client";

import { useEffect, useRef } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import type { Notification } from "@/types";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type NotificationType = Notification["type"];

export function useMarkNotificationsReadConvex(
  types: NotificationType[],
  enabled = true,
  relatedUserId?: Id<"users">
) {
  const markNotificationsRead = useMutation(
    api.notifications.markNotificationsRead
  );
  const markedKeyRef = useRef<string | null>(null);
  const markKey = `${types.join(",")}:${relatedUserId ?? ""}`;

  useEffect(() => {
    if (!enabled || types.length === 0) return;
    if (markedKeyRef.current === markKey) return;
    markedKeyRef.current = markKey;
    void markNotificationsRead({
      types,
      relatedUserId,
    });
  }, [enabled, markKey, markNotificationsRead, relatedUserId, types]);
}
