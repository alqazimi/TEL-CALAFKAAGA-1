"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isApiProvider } from "../provider";
import { getProfileAdapter } from "./index";

export function useEnsureProfile() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(async () => getProfileAdapter().ensureProfile(), []);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const convexEnsure = useMutation(api.profiles.ensureProfile);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(async () => convexEnsure({}), [convexEnsure]);
}

export function useUpdateProfile() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (patch: Record<string, unknown>) =>
        getProfileAdapter().updateProfile(patch),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const convexUpdate = useMutation(api.profiles.updateProfile);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (patch: Record<string, unknown>) => convexUpdate(patch as never),
    [convexUpdate]
  );
}

export function useCompleteRegistrationGender() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (gender: "male" | "female") =>
        getProfileAdapter().completeRegistrationGender(gender),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const convexMut = useMutation(api.profiles.completeRegistrationGender);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (gender: "male" | "female") => convexMut({ gender }),
    [convexMut]
  );
}

export function useUpdateWaliContact() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (data: { waliName?: string; waliPhone?: string }) =>
        getProfileAdapter().updateProfile(data),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.profiles.updateWaliContact);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (data: { waliName?: string; waliPhone?: string }) =>
      mut(data as never),
    [mut]
  );
}

// Re-export query hooks from the fuller hooks file sections
export {
  useProfile,
  usePreferencesQuery,
  usePreferences,
  useWaliForMatch,
} from "./hooks-queries";
