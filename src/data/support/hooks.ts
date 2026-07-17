"use client";

import { useCallback, useEffect, useState } from "react";
import { apiSupport } from "./api";

export function useMySupportMessages() {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    let cancelled = false;
    void apiSupport
      .listMine()
      .then((d) => {
        if (!cancelled) setApiData(d);
      })
      .catch(() => {
        if (!cancelled) setApiData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return apiData;
}

export function useSendSupportMessage() {
  return useCallback(
    async (body: Record<string, unknown>) => apiSupport.create(body),
    []
  );
}

export function useReplyAsMember() {
  return useCallback(
    async (args: { contactId: string; message: string }) =>
      apiSupport.replyAsMember(args.contactId, args.message),
    []
  );
}

export function useSendPublicContact() {
  return useCallback(
    async (body: Record<string, unknown>) =>
      apiSupport.sendPublicContact(body),
    []
  );
}

export function useAdminReplySupport() {
  return useCallback(
    async (args: { contactId: string; message: string }) =>
      apiSupport.admin.reply(args.contactId, args.message),
    []
  );
}

export function useAdminUpdateSupportStatus() {
  return useCallback(
    async (args: {
      contactId: string;
      status: string;
      adminNotes?: string;
    }) => apiSupport.admin.updateStatus(args.contactId, args.status),
    []
  );
}
