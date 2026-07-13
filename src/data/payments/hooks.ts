"use client";

import { useCallback, useEffect, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSafeQuery } from "@/lib/use-safe-query";
import { isApiProvider } from "../provider";
import { getPaymentsAdapter } from "./index";

export function useCreateRegistrationCheckout() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: { tier: string }) =>
        getPaymentsAdapter().createRegistrationCheckout(args.tier),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const action = useAction(api.stripeActions.createRegistrationCheckout);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: { tier: string }) => action(args as never),
    [action]
  );
}

export function useCreatePremiumUpgradeCheckout() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async () => getPaymentsAdapter().createPremiumUpgradeCheckout(),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const action = useAction(api.stripeActions.createPremiumUpgradeCheckout);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(async () => action({}), [action]);
}

export function useVerifyCheckoutSession() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: { sessionId: string }) =>
        getPaymentsAdapter().verifySession(args.sessionId),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const action = useAction(api.stripeActions.verifyCheckoutSession);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: { sessionId: string }) => action(args as never),
    [action]
  );
}

export function useEvcLatestProof() {
  const apiMode = isApiProvider();
  // Always call the same hooks (Rules of Hooks). Skip Convex entirely in API mode.
  const convexData = useSafeQuery(
    api.evcPayments.myLatestProof,
    apiMode ? ("skip" as const) : {}
  );
  const [apiData, setApiData] = useState<unknown>(undefined);

  useEffect(() => {
    if (!apiMode) return;
    let cancelled = false;
    void getPaymentsAdapter()
      .evc.myLatest()
      .then((d) => {
        if (!cancelled) setApiData(d);
      })
      .catch(() => {
        if (!cancelled) setApiData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [apiMode]);

  return apiMode ? apiData : convexData;
}

export function useSubmitEvcProof() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (body: Record<string, unknown>) =>
        getPaymentsAdapter().evc.submitProof(body),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.evcPayments.submitProof);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (body: Record<string, unknown>) => mut(body as never),
    [mut]
  );
}
