"use client";

import { useCallback, useEffect, useState } from "react";
import { useSafeMutation as useMutation } from "@/lib/use-safe-mutation";
import { api } from "../../../convex/_generated/api";
import { useSafeQuery } from "@/lib/use-safe-query";
import { isApiProvider } from "../provider";
import { getModerationAdapter } from "./index";

export function useMyBlocks() {
  const convex = useSafeQuery(
    api.moderation.listMyBlocks,
    isApiProvider() ? "skip" : {}
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider()) return;
    let c = false;
    void getModerationAdapter()
      .listMyBlocks()
      .then((d) => {
        if (!c) setApiData(d);
      })
      .catch(() => {
        if (!c) setApiData(null);
      });
    return () => {
      c = true;
    };
  }, []);
  return isApiProvider() ? apiData : convex;
}

export function useBlockUser() {
  const mut = useMutation(api.moderation.blockUser);
  return useCallback(
    async (
      args: { blockedUserId: string; reason?: string } | string,
      reason?: string
    ) => {
      const blockedUserId =
        typeof args === "string" ? args : args.blockedUserId;
      const r = typeof args === "string" ? reason : args.reason;
      if (isApiProvider())
        return getModerationAdapter().blockUser(blockedUserId, r);
      return mut({ blockedUserId, reason: r } as never);
    },
    [mut]
  );
}

export function useUnblockUser() {
  const mut = useMutation(api.moderation.unblockUser);
  return useCallback(
    async (args: { blockedUserId: string } | string) => {
      const blockedUserId =
        typeof args === "string" ? args : args.blockedUserId;
      if (isApiProvider())
        return getModerationAdapter().unblockUser(blockedUserId);
      return mut({ blockedUserId } as never);
    },
    [mut]
  );
}

export function useReportUser() {
  const mut = useMutation(api.moderation.reportUser);
  return useCallback(
    async (body: {
      reportedUserId?: string;
      userId?: string;
      reason: string;
      details?: string;
      alsoBlock?: boolean;
    }) => {
      const reportedUserId = body.reportedUserId ?? body.userId;
      if (!reportedUserId) throw new Error("reportedUserId required");
      const payload = {
        reportedUserId,
        reason: body.reason,
        details: body.details,
        alsoBlock: body.alsoBlock,
      };
      if (isApiProvider())
        return getModerationAdapter().reportUser({
          userId: reportedUserId,
          reason: body.reason,
          details: body.details,
          alsoBlock: body.alsoBlock,
        });
      return mut(payload as never);
    },
    [mut]
  );
}
