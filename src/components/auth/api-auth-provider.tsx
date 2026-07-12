"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiAuth } from "@/data/auth/api";
import type { AccessStateLike, SessionUser } from "@/data/types";
import {
  connectRealtime,
  disconnectRealtime,
  setRealtimeRefreshCallback,
  subscribeRealtime,
} from "@/data/realtime/socket-client";
import { track } from "@/data/telemetry";

type ApiAuthContextValue = {
  user: SessionUser | null;
  accessState: AccessStateLike | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
};

const ApiAuthContext = createContext<ApiAuthContextValue | null>(null);

export function ApiAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessState, setAccessState] = useState<AccessStateLike | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiAuth.bootstrapMe();
      setUser(res.user);
      setAccessState(res.accessState);
      if (res.user && res.accessState) {
        const paidProfile = Boolean(
          (res.user as { hasPaid?: boolean }).hasPaid ??
            (res.user.profile as { hasPaid?: boolean } | null | undefined)
              ?.hasPaid
        );
        if (
          typeof res.accessState.hasPaid === "boolean" &&
          paidProfile !== res.accessState.hasPaid
        ) {
          track("access_state_mismatch");
        }
      }
    } catch {
      setUser(null);
      setAccessState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    connectRealtime();
    setRealtimeRefreshCallback(() => {
      void refresh();
    });
    const unsub = subscribeRealtime("session:revoked", () => {
      setUser(null);
      setAccessState(null);
      disconnectRealtime();
    });
    return () => {
      unsub();
      setRealtimeRefreshCallback(null);
    };
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      await apiAuth.login(email, password);
      await refresh();
      connectRealtime();
    },
    [refresh]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await apiAuth.register(email, password);
      await refresh();
      connectRealtime();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await apiAuth.logout();
    setUser(null);
    setAccessState(null);
  }, []);

  const logoutAll = useCallback(async () => {
    await apiAuth.logoutAll();
    setUser(null);
    setAccessState(null);
  }, []);

  const value = useMemo<ApiAuthContextValue>(
    () => ({
      user,
      accessState,
      isAuthenticated: Boolean(user),
      isLoading,
      refresh,
      login,
      register,
      logout,
      logoutAll,
    }),
    [user, accessState, isLoading, refresh, login, register, logout, logoutAll]
  );

  return (
    <ApiAuthContext.Provider value={value}>{children}</ApiAuthContext.Provider>
  );
}

export function useApiAuth(): ApiAuthContextValue {
  const ctx = useContext(ApiAuthContext);
  if (!ctx) {
    throw new Error("useApiAuth must be used within ApiAuthProvider");
  }
  return ctx;
}

/** Safe variant — returns null outside provider (e.g. convex mode). */
export function useApiAuthOptional(): ApiAuthContextValue | null {
  return useContext(ApiAuthContext);
}
