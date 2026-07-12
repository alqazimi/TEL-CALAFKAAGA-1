"use client";

import { useCallback, useMemo } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useConvexAuth } from "convex/react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { api } from "../../../convex/_generated/api";
import { isApiProvider } from "@/data/provider";
import { useApiAuth } from "@/components/auth/api-auth-provider";
import { disconnectRealtime } from "@/data/realtime/socket-client";
import { apiAuth } from "./api";
import type { LoginResult } from "./types";
import type { SessionUser } from "@/data/types";

export type UnifiedAuth = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SessionUser | null | undefined;
  signOut: () => Promise<void>;
  login?: (email: string, password: string) => Promise<void>;
  register?: (email: string, password: string) => Promise<LoginResult | void>;
  checkEmail?: (email: string) => Promise<{ available: boolean }>;
  refresh?: () => Promise<void>;
};

/**
 * Provider is a build-time env constant (NEXT_PUBLIC_BACKEND_PROVIDER),
 * so the hook branch is stable across renders.
 */
export function useUnifiedAuth(): UnifiedAuth {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiUnifiedAuth();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useConvexUnifiedAuth();
}

function useApiUnifiedAuth(): UnifiedAuth {
  const apiAuthCtx = useApiAuth();
  const signOut = useCallback(async () => {
    await apiAuthCtx.logout();
    disconnectRealtime();
  }, [apiAuthCtx]);

  return useMemo(
    () => ({
      isAuthenticated: apiAuthCtx.isAuthenticated,
      isLoading: apiAuthCtx.isLoading,
      user: apiAuthCtx.user,
      signOut,
      login: apiAuthCtx.login,
      register: apiAuthCtx.register,
      checkEmail: (email: string) => apiAuth.checkEmail(email),
      refresh: apiAuthCtx.refresh,
    }),
    [apiAuthCtx, signOut]
  );
}

function useConvexUnifiedAuth(): UnifiedAuth {
  const convexAuth = useConvexAuth();
  const { signOut: convexSignOut } = useAuthActions();
  const convexUser = useSafeQuery(api.users.currentUser);

  const signOut = useCallback(async () => {
    await convexSignOut();
  }, [convexSignOut]);

  return useMemo(
    () => ({
      isAuthenticated: convexAuth.isAuthenticated,
      isLoading: convexAuth.isLoading,
      user: convexUser as SessionUser | null | undefined,
      signOut,
    }),
    [convexAuth.isAuthenticated, convexAuth.isLoading, convexUser, signOut]
  );
}

export function useChangePassword() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: { currentPassword: string; newPassword: string }) =>
        apiAuth.changePassword(args.currentPassword, args.newPassword),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const action = useAction(api.account.changePassword);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: { currentPassword: string; newPassword: string }) =>
      action(args as never),
    [action]
  );
}
