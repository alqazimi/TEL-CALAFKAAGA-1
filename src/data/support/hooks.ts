"use client";

import { useCallback, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { useSafeMutation as useMutation } from "@/lib/use-safe-mutation";
import { api } from "../../../convex/_generated/api";
import { useSafeQuery } from "@/lib/use-safe-query";
import { isApiProvider } from "../provider";
import { getSupportAdapter } from "./index";

export function useMySupportMessages() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiMySupport();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(api.supportContacts.listMySupportMessages, {});
}

function useApiMySupport() {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    let cancelled = false;
    void getSupportAdapter()
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
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (body: Record<string, unknown>) => getSupportAdapter().create(body),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.supportContacts.sendSupportMessage);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (body: Record<string, unknown>) => mut(body as never),
    [mut]
  );
}

export function useReplyAsMember() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: { contactId: string; message: string }) =>
        getSupportAdapter().replyAsMember(args.contactId, args.message),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.supportContacts.replyAsMember);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: { contactId: string; message: string }) => mut(args as never),
    [mut]
  );
}

export function useSendPublicContact() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (body: Record<string, unknown>) =>
        getSupportAdapter().sendPublicContact(body),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const action = useAction(api.contact.sendContactMessage);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (body: Record<string, unknown>) => action(body as never),
    [action]
  );
}

export function useAdminReplySupport() {
  const mut = useMutation(api.supportContacts.replyAsAdmin);
  return useCallback(
    async (args: { contactId: string; message: string }) => {
      if (isApiProvider())
        return getSupportAdapter().admin.reply(args.contactId, args.message);
      return mut(args as never);
    },
    [mut]
  );
}

export function useAdminUpdateSupportStatus() {
  const mut = useMutation(api.supportContacts.updateSupportContactStatus);
  return useCallback(
    async (args: {
      contactId: string;
      status: string;
      adminNotes?: string;
    }) => {
      if (isApiProvider())
        return getSupportAdapter().admin.updateStatus(
          args.contactId,
          args.status
        );
      return mut(args as never);
    },
    [mut]
  );
}
