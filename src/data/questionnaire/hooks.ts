"use client";

import { useCallback } from "react";
import { useAction } from "convex/react";
import { useSafeMutation as useMutation } from "@/lib/use-safe-mutation";
import { api } from "../../../convex/_generated/api";
import { isApiProvider } from "../provider";
import { getQuestionnaireAdapter } from "./index";
import { apiClient } from "../api-client";

type StepDataArgs = { step: number; data: Record<string, unknown> };
type DataArgs = { data: Record<string, unknown> };

export function useUpdateQuestionnaire() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: StepDataArgs) =>
        getQuestionnaireAdapter().updateQuestionnaire(args.step, args.data),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.profiles.updateQuestionnaire);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(async (args: StepDataArgs) => mut(args as never), [mut]);
}

export function useAutoSaveQuestionnaire() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: StepDataArgs) =>
        getQuestionnaireAdapter().autoSave(args.step, args.data),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.profiles.autoSaveProfile);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(async (args: StepDataArgs) => mut(args as never), [mut]);
}

export function useCompleteQuestionnaire() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (data?: Record<string, unknown>) =>
        getQuestionnaireAdapter().completeQuestionnaire(data),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.profiles.completeQuestionnaire);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (data?: Record<string, unknown>) => mut((data ?? {}) as never),
    [mut]
  );
}

export function useSaveProfileEdits() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: DataArgs) =>
        getQuestionnaireAdapter().saveProfileEdits(args.data),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.profiles.saveProfileEdits);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(async (args: DataArgs) => mut(args as never), [mut]);
}

/** GPS verify + persist — Nest route optional; falls back to Convex action. */
export function useVerifyAndSaveLocation() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: {
        latitude: number;
        longitude: number;
        accuracy?: number;
      }) =>
        apiClient.post<{ country: string; city: string }>(
          "/profile/geolocation/verify",
          args
        ),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const action = useAction(api.geolocation.verifyAndSaveLocation);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    }) => action(args as never) as Promise<{ country: string; city: string }>,
    [action]
  );
}
