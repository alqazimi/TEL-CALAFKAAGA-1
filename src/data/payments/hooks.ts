"use client";

import { useCallback, useEffect, useState } from "react";
import { isAbortError, toLoadErrorMessage } from "../query-error";
import { apiPayments } from "./api";

export function useCreateRegistrationCheckout() {
  return useCallback(
    async (args: { tier: string }) =>
      apiPayments.createRegistrationCheckout(args.tier),
    []
  );
}

export function useCreatePremiumUpgradeCheckout() {
  return useCallback(
    async () => apiPayments.createPremiumUpgradeCheckout(),
    []
  );
}

export function useVerifyCheckoutSession() {
  return useCallback(
    async (args: { sessionId: string }) =>
      apiPayments.verifySession(args.sessionId),
    []
  );
}

export function useEvcLatestProof() {
  const [proof, setProof] = useState<unknown>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void apiPayments.evc
      .myLatest()
      .then((d) => {
        if (!cancelled) {
          setProof(d);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled || isAbortError(err)) return;
        setError(toLoadErrorMessage(err));
        setProof((prev: unknown) => (prev === undefined ? null : prev));
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);
  return { proof, error, refresh };
}

export function useSubmitEvcProof() {
  return useCallback(
    async (body: Record<string, unknown>) =>
      apiPayments.evc.submitProof(body),
    []
  );
}
