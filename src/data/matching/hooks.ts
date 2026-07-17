"use client";

import { useCallback, useEffect, useState } from "react";
import { useSafeMutation as useMutation } from "@/lib/use-safe-mutation";
import { api } from "../../../convex/_generated/api";
import { useSafeQuery } from "@/lib/use-safe-query";
import { isApiProvider } from "../provider";
import { getMatchingAdapter } from "./index";

export function useMatches(
  filters?: Record<string, unknown>,
  enabled = true
) {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiMatches(enabled ? filters : undefined, enabled);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(
    api.matches.getMatches,
    enabled ? ((filters ?? {}) as never) : "skip"
  );
}

function useApiMatches(
  filters: Record<string, unknown> | undefined,
  enabled: boolean
) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let cancelled = false;
    void getMatchingAdapter()
      .getMatches(filters)
      .then((d) => {
        if (!cancelled) setApiData(d);
      })
      .catch(() => {
        if (!cancelled) setApiData(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters ?? {}), enabled]);
  return apiData;
}

export function useMatchLists(
  filters?: Record<string, unknown>,
  enabled = true
) {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiMatchLists(enabled ? filters : undefined, enabled);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(
    api.matches.getMatchLists,
    enabled ? ((filters ?? {}) as never) : "skip"
  );
}

function useApiMatchLists(
  filters: Record<string, unknown> | undefined,
  enabled: boolean
) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let cancelled = false;
    void getMatchingAdapter()
      .getMatchLists(filters)
      .then((d) => {
        if (!cancelled) setApiData(d);
      })
      .catch(() => {
        if (!cancelled) setApiData(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters ?? {}), enabled]);
  return apiData;
}

export function useMyMatches(enabled = true) {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiMyMatches(enabled);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(api.matches.getMyMatches, enabled ? {} : "skip");
}

function useApiMyMatches(enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let cancelled = false;
    void getMatchingAdapter()
      .getMyMatches()
      .then((d) => {
        if (!cancelled) setApiData(d);
      })
      .catch(() => {
        if (!cancelled) setApiData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return apiData;
}

export function useHomeFeed(enabled = true) {
  const [data, setData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setData(undefined);
      return;
    }
    let cancelled = false;
    void getMatchingAdapter()
      .getHomeFeed()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return data;
}

export function useLikeUser() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: {
        userId?: string;
        toUserId?: string;
        action?: "like" | "pass" | "shortlist";
      }) => {
        const userId = args.userId ?? args.toUserId;
        if (!userId) throw new Error("userId required");
        return getMatchingAdapter().likeUser(
          userId,
          args.action === "pass"
            ? "pass"
            : args.action === "shortlist"
              ? "shortlist"
              : "like"
        );
      },
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.matches.likeUser);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: {
      userId?: string;
      toUserId?: string;
      action?: "like" | "pass" | "shortlist";
    }) => mut(args as never),
    [mut]
  );
}

export function useMarkMatchSeen() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: { matchId: string } | string) => {
        const matchId = typeof args === "string" ? args : args.matchId;
        return getMatchingAdapter().markMatchSeen(matchId);
      },
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.matches.markMatchSeen);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: { matchId: string } | string) => {
      const matchId = typeof args === "string" ? args : args.matchId;
      return mut({ matchId } as never);
    },
    [mut]
  );
}

export function useArchiveMatch() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: { matchId: string; archived?: boolean }) =>
        getMatchingAdapter().archiveMatch(args.matchId, args.archived ?? true),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.matches.archiveMatch);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: { matchId: string; archived?: boolean }) => mut(args as never),
    [mut]
  );
}

export function useCompatibilityBreakdown(
  targetUserId: string | undefined,
  enabled = true
) {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiBreakdown(enabled ? targetUserId : undefined);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSafeQuery(
    api.matches.getCompatibilityBreakdown,
    enabled && targetUserId ? ({ targetUserId } as never) : "skip"
  );
}

function useApiBreakdown(userId: string | undefined) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!userId) {
      setApiData(undefined);
      return;
    }
    let cancelled = false;
    void getMatchingAdapter()
      .getCompatibilityBreakdown(userId)
      .then((d) => {
        if (!cancelled) setApiData(d);
      })
      .catch(() => {
        if (!cancelled) setApiData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return apiData;
}

export function usePrivateRevealStatus(matchId: string | undefined, enabled = true) {
  const [data, setData] = useState<unknown>(undefined);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled || !matchId) {
      setData(undefined);
      return;
    }
    let cancelled = false;
    void getMatchingAdapter()
      .getPrivateRevealStatus(matchId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId, enabled, tick]);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  return { data, refresh };
}

export function useRevealPrivatePhoto() {
  return useCallback(async (matchId: string, mediaId?: string) => {
    return getMatchingAdapter().revealPrivatePhoto(matchId, mediaId);
  }, []);
}

