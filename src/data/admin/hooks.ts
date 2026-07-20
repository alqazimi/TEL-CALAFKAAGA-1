"use client";

import { useCallback, useEffect, useState } from "react";
import { apiAdmin } from "./api";
import { apiSupport } from "../support/api";
import { apiModeration } from "../moderation/api";

/**
 * Admin reactive/query hooks — one-shot REST fetch via Nest adapters.
 * IDs are profile/report/invite UUIDs as used by the UI.
 */

function withEntityIds(rows: unknown): unknown[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const item = row as Record<string, unknown>;
    const id =
      (typeof item._id === "string" && item._id) ||
      (typeof item.id === "string" && item.id) ||
      "";
    return { ...item, _id: id, id: id || item.id };
  });
}

function unwrapItems(d: unknown): unknown[] {
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && Array.isArray((d as { items?: unknown[] }).items)) {
    return (d as { items: unknown[] }).items;
  }
  return [];
}

export function useAdminBootstrapStatus(enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    // Nest has no bootstrap claim API — treat as admins already exist.
    setApiData({ hasAdmins: true, canClaim: false, reason: "api_mode" });
  }, [enabled]);
  return apiData;
}

export function useAdminStats(enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin
      .stats()
      .then((d) => {
        if (!c) setApiData(d);
      })
      .catch(() => {
        if (!c) setApiData(null);
      });
    return () => {
      c = true;
    };
  }, [enabled]);
  return apiData;
}

export function useAdminUsers(
  enabled: boolean,
  opts?: Record<string, unknown>
) {
  const [apiData, setApiData] = useState<unknown[] | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const key = JSON.stringify(opts ?? {});
  const reload = useCallback(() => {
    void apiAdmin.users
      .list(opts)
      .then((d) => {
        const payload = d as { items?: unknown[]; nextCursor?: string | null };
        const raw = Array.isArray(d) ? d : (payload?.items ?? []);
        setApiData(withEntityIds(raw));
        setNextCursor(
          !Array.isArray(d) && typeof payload.nextCursor === "string"
            ? payload.nextCursor
            : null
        );
      })
      .catch(() => {
        setApiData([]);
        setNextCursor(null);
      });
  }, [key]);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      setNextCursor(null);
      return;
    }
    let c = false;
    setApiData(undefined);
    setNextCursor(null);
    void apiAdmin.users
      .list(opts)
      .then((d) => {
        if (c) return;
        const payload = d as { items?: unknown[]; nextCursor?: string | null };
        const raw = Array.isArray(d) ? d : (payload?.items ?? []);
        const items = withEntityIds(raw);
        setApiData(items);
        setNextCursor(
          !Array.isArray(d) && typeof payload.nextCursor === "string"
            ? payload.nextCursor
            : null
        );
      })
      .catch(() => {
        if (!c) {
          setApiData([]);
          setNextCursor(null);
        }
      });
    return () => {
      c = true;
    };
  }, [enabled, key]);

  const loadMore = useCallback(async () => {
    if (!enabled || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const d = await apiAdmin.users.list({
        ...(opts ?? {}),
        cursor: nextCursor,
      });
      const payload = d as { items?: unknown[]; nextCursor?: string | null };
      const raw = Array.isArray(d) ? d : (payload?.items ?? []);
      const items = withEntityIds(raw);
      setApiData((prev) => [...(prev ?? []), ...items]);
      setNextCursor(
        !Array.isArray(d) && typeof payload.nextCursor === "string"
          ? payload.nextCursor
          : null
      );
    } catch {
      // keep existing page
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, loadingMore, nextCursor, opts]);

  return {
    users: apiData,
    loadMore,
    hasMore: Boolean(nextCursor),
    loadingMore,
    reload,
  };
}

export function useAdminAnalytics(enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin.analytics().then((d) => {
      if (!c) setApiData(d);
    });
    return () => {
      c = true;
    };
  }, [enabled]);
  return apiData;
}

export function useAdminPayments(enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin.payments
      .list({ status: "completed", limit: 100 })
      .then((d) => {
        if (!c) {
          setApiData(withEntityIds(unwrapItems(d)));
        }
      });
    return () => {
      c = true;
    };
  }, [enabled]);
  return apiData;
}

export function useAdminReports(enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin.reports.list().then((d) => {
      if (!c) {
        setApiData(withEntityIds(unwrapItems(d)));
      }
    });
    return () => {
      c = true;
    };
  }, [enabled]);
  return apiData;
}

export function useAdminSupportContacts(
  enabled: boolean,
  opts?: { status?: string }
) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiSupport.admin
      .list(opts)
      .then((d) => {
        if (!c) {
          setApiData(withEntityIds(unwrapItems(d)));
        }
      })
      .catch(() => {
        if (!c) setApiData([]);
      });
    return () => {
      c = true;
    };
  }, [enabled, opts?.status]);
  return apiData;
}

export function useAdminAuditLogs(enabled: boolean, limit = 80) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin.auditLogs({ limit }).then((d) => {
      if (!c) {
        setApiData(withEntityIds(unwrapItems(d)));
      }
    });
    return () => {
      c = true;
    };
  }, [enabled, limit]);
  return apiData;
}

/** profileId — Nest UUID */
export function useAdminApproveUser() {
  return useCallback(
    async (profileId: string) => apiAdmin.users.approve(profileId),
    []
  );
}

export function useAdminRejectUser() {
  return useCallback(
    async (profileId: string, reason?: string) =>
      apiAdmin.users.reject(profileId, reason),
    []
  );
}

export function useAdminBanUser() {
  return useCallback(async (profileId: string, banned = true) => {
    return banned
      ? apiAdmin.users.ban(profileId)
      : apiAdmin.users.unban(profileId);
  }, []);
}

export function useAdminRequestPhoto() {
  return useCallback(
    async (profileId: string, _message?: string) =>
      apiAdmin.users.requestPhoto(profileId),
    []
  );
}

export function useAdminDeleteUser() {
  return useCallback(
    async (profileId: string) => apiAdmin.users.delete(profileId),
    []
  );
}

export function useAdminSetRole() {
  return useCallback(
    async (profileId: string, role: string) =>
      apiAdmin.users.setRole(profileId, role),
    []
  );
}

export function useAdminCreateAnnouncement() {
  return useCallback(
    async (body: Record<string, unknown>) =>
      apiAdmin.announcements.create(body),
    []
  );
}

export function useAdminUpdateReportStatus() {
  return useCallback(
    async (args: {
      reportId: string;
      status: "reviewed" | "dismissed";
      notes?: string;
      adminNotes?: string;
      priority?: string;
      resolution?: string;
    }) => {
      const notes = args.notes ?? args.adminNotes;
      const body = {
        notes,
        priority: args.priority,
        resolution: args.resolution,
      };
      return args.status === "reviewed"
        ? apiAdmin.reports.resolve(args.reportId, body)
        : apiAdmin.reports.dismiss(args.reportId, body);
    },
    []
  );
}

export function useAdminEvcPending(enabled = true) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  const reload = useCallback(() => {
    if (!enabled) return;
    setApiData(undefined);
    void apiAdmin.evc.pending().then((d) => {
      setApiData(withEntityIds(unwrapItems(d)));
    });
  }, [enabled]);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin.evc.pending().then((d) => {
      if (!c) setApiData(withEntityIds(unwrapItems(d)));
    });
    return () => {
      c = true;
    };
  }, [enabled]);
  return { pending: apiData, reload };
}

export function useAdminApproveEvc() {
  return useCallback(
    async (proofId: string) => apiAdmin.evc.approve(proofId),
    []
  );
}

export function useAdminRejectEvc() {
  return useCallback(
    async (proofId: string, reason?: string) =>
      apiAdmin.evc.reject(proofId, reason),
    []
  );
}

export function useAdminUserDetail(profileId: string | null, enabled: boolean) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled || !profileId) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin.users
      .detail(profileId)
      .then((d) => {
        if (!c) setApiData(d);
      })
      .catch(() => {
        if (!c) setApiData(null);
      });
    return () => {
      c = true;
    };
  }, [enabled, profileId]);
  return apiData;
}

export function useAdminUserActivity(
  profileId: string | null,
  enabled: boolean
) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled || !profileId) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin.users
      .activity(profileId)
      .then((d) => {
        if (!c) setApiData(d);
      })
      .catch(() => {
        if (!c) setApiData(null);
      });
    return () => {
      c = true;
    };
  }, [enabled, profileId]);
  return apiData;
}

export function useAdminAdvisorReviewed() {
  return useCallback(
    async (profileId: string, advisorReviewed: boolean) =>
      apiAdmin.users.advisorReviewed(profileId, advisorReviewed),
    []
  );
}

/** Prefer moderation adapter for member safety actions. */
export function useModerationBlock() {
  return useCallback(async (userId: string) => {
    return apiModeration.blockUser(userId);
  }, []);
}

export function useClaimFirstAdmin() {
  return useCallback(async (_args: { secret: string }) => {
    throw new Error("Admin bootstrap claim is not available in API mode");
  }, []);
}

export function useStaffInvitesList(enabled = true) {
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void apiAdmin.staffInvites
      .list()
      .then((d) => {
        if (!c) {
          const raw = Array.isArray(d)
            ? d
            : ((d as { items?: unknown[] })?.items ?? d);
          const items = Array.isArray(raw)
            ? raw.map((row) => {
                const invite = row as Record<string, unknown>;
                const id =
                  (typeof invite._id === "string" && invite._id) ||
                  (typeof invite.id === "string" && invite.id) ||
                  "";
                const expiresAt =
                  typeof invite.expiresAt === "number"
                    ? invite.expiresAt
                    : typeof invite.expiresAt === "string"
                      ? Date.parse(invite.expiresAt) || 0
                      : 0;
                return { ...invite, _id: id, id, expiresAt };
              })
            : [];
          setApiData(items);
        }
      })
      .catch(() => {
        if (!c) setApiData([]);
      });
    return () => {
      c = true;
    };
  }, [enabled]);
  return apiData;
}

export function useCreateStaffInvite() {
  return useCallback(
    async (args: { email: string }) =>
      apiAdmin.staffInvites.create(args) as Promise<{ email: string }>,
    []
  );
}

export function useRevokeStaffInvite() {
  return useCallback(
    async (args: { inviteId: string }) =>
      apiAdmin.staffInvites.revoke(args.inviteId),
    []
  );
}

export function useResendStaffInvite() {
  return useCallback(async (_args: { inviteId: string }) => {
    throw new Error("Staff invite resend is not available in API mode");
  }, []);
}
