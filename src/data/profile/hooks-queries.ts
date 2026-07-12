"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useSafeQuery } from "@/lib/use-safe-query";
import { isApiProvider } from "../provider";
import { apiProfile } from "./api";

const POLL_MS = 15_000;

export function useProfile() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiProfile();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useConvexProfile();
}

function useApiProfile() {
  const [apiData, setApiData] = useState<unknown>(undefined);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setApiData(await apiProfile.getProfile());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return { profile: apiData, loading, refresh };
}

function useConvexProfile() {
  const convexProfile = useSafeQuery(api.profiles.getProfile, {});
  return {
    profile: convexProfile,
    loading: convexProfile === undefined,
    refresh: async () => undefined,
  };
}

export function usePreferencesQuery() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiPreferences();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(api.profiles.getPreferences, {});
}

function useApiPreferences() {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { apiPreferences } = await import("../preferences/api");
      const data = await apiPreferences.getPreferences();
      if (!cancelled) setApiData(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return apiData;
}

export function useWaliForMatch(targetUserId: string | undefined) {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiWali(targetUserId);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(
    api.profiles.getWaliForMatch,
    targetUserId ? ({ targetUserId } as never) : "skip"
  );
}

function useApiWali(targetUserId: string | undefined) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!targetUserId) {
      setApiData(undefined);
      return;
    }
    let cancelled = false;
    // Nest may expose wali on match detail later; safe empty for now.
    void apiProfile
      .getProfile()
      .then(() => {
        if (!cancelled) setApiData(null);
      })
      .catch(() => {
        if (!cancelled) setApiData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [targetUserId]);
  return apiData;
}
