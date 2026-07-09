"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Notification } from "@/types";

type NotificationType = Notification["type"];

export function useMarkNotificationsRead(
  types: NotificationType[],
  enabled = true,
  relatedUserId?: Id<"users">
) {
  const markNotificationsRead = useMutation(api.notifications.markNotificationsRead);
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
