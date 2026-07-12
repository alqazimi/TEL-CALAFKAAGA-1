"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSafeQuery } from "@/lib/use-safe-query";
import { isApiProvider } from "../provider";
import { getAdminAdapter } from "./index";
import { getSupportAdapter } from "../support";
import { getModerationAdapter } from "../moderation";

/**
 * Admin reactive/query hooks — Convex subscriptions when provider=convex,
 * one-shot REST fetch when provider=api.
 * IDs are always profile/report/invite UUIDs or Convex profile ids as used by the UI.
 */

export function useAdminBootstrapStatus(enabled: boolean) {
  const convex = useSafeQuery(
    api.admin.getBootstrapStatus,
    !isApiProvider() && enabled ? {} : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    // Nest has no bootstrap claim API — treat as admins already exist.
    setApiData({ hasAdmins: true, canClaim: false, reason: "api_mode" });
  }, [enabled]);
  return isApiProvider() ? apiData : convex;
}

export function useAdminStats(enabled: boolean) {
  const convex = useSafeQuery(
    api.admin.getStats,
    !isApiProvider() && enabled ? {} : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
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
  return isApiProvider() ? apiData : convex;
}

export function useAdminUsers(
  enabled: boolean,
  opts?: Record<string, unknown>
) {
  const convex = useSafeQuery(
    api.admin.getAllUsers,
    !isApiProvider() && enabled ? ((opts ?? {}) as never) : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  const key = JSON.stringify(opts ?? {});
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
      .users.list(opts)
      .then((d) => {
        if (!c) {
          // Nest returns { items, nextCursor }; Convex returns array.
          const items = Array.isArray(d)
            ? d
            : ((d as { items?: unknown[] })?.items ?? d);
          setApiData(items);
        }
      })
      .catch(() => {
        if (!c) setApiData([]);
      });
    return () => {
      c = true;
    };
  }, [enabled, key]);
  return isApiProvider() ? apiData : convex;
}

export function useAdminAnalytics(enabled: boolean) {
  const convex = useSafeQuery(
    api.admin.getAnalytics,
    !isApiProvider() && enabled ? {} : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
      .analytics()
      .then((d) => {
        if (!c) setApiData(d);
      });
    return () => {
      c = true;
    };
  }, [enabled]);
  return isApiProvider() ? apiData : convex;
}

export function useAdminPayments(enabled: boolean) {
  const convex = useSafeQuery(
    api.admin.getAllPayments,
    !isApiProvider() && enabled ? {} : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
      .payments.list({ status: "completed", limit: 100 })
      .then((d) => {
        if (!c) {
          const items = Array.isArray(d)
            ? d
            : ((d as { items?: unknown[] })?.items ?? []);
          setApiData(items);
        }
      });
    return () => {
      c = true;
    };
  }, [enabled]);
  return isApiProvider() ? apiData : convex;
}

export function useAdminReports(enabled: boolean) {
  const convex = useSafeQuery(
    api.moderation.listReports,
    !isApiProvider() && enabled ? {} : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
      .reports.list()
      .then((d) => {
        if (!c) {
          const items = Array.isArray(d)
            ? d
            : ((d as { items?: unknown[] })?.items ?? []);
          setApiData(items);
        }
      });
    return () => {
      c = true;
    };
  }, [enabled]);
  return isApiProvider() ? apiData : convex;
}

export function useAdminSupportContacts(
  enabled: boolean,
  opts?: { status?: string }
) {
  const convex = useSafeQuery(
    api.supportContacts.listSupportContacts,
    !isApiProvider() && enabled ? ((opts ?? {}) as never) : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getSupportAdapter()
      .admin.list(opts)
      .then((d) => {
        if (!c) {
          const items = Array.isArray(d)
            ? d
            : ((d as { items?: unknown[] })?.items ?? []);
          setApiData(items);
        }
      })
      .catch(() => {
        if (!c) setApiData([]);
      });
    return () => {
      c = true;
    };
  }, [enabled, opts?.status]);
  return isApiProvider() ? apiData : convex;
}

export function useAdminAuditLogs(enabled: boolean, limit = 80) {
  const convex = useSafeQuery(
    api.admin.getAuditLogs,
    !isApiProvider() && enabled ? ({ limit } as never) : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
      .auditLogs({ limit })
      .then((d) => {
        if (!c) {
          const items = Array.isArray(d)
            ? d
            : ((d as { items?: unknown[] })?.items ?? []);
          setApiData(items);
        }
      });
    return () => {
      c = true;
    };
  }, [enabled, limit]);
  return isApiProvider() ? apiData : convex;
}

/** profileId — Convex Id or Nest UUID */
export function useAdminApproveUser() {
  const mut = useMutation(api.admin.approveUser);
  return useCallback(
    async (profileId: string) => {
      if (isApiProvider()) return getAdminAdapter().users.approve(profileId);
      return mut({ profileId } as never);
    },
    [mut]
  );
}

export function useAdminRejectUser() {
  const mut = useMutation(api.admin.rejectUser);
  return useCallback(
    async (profileId: string, reason?: string) => {
      if (isApiProvider())
        return getAdminAdapter().users.reject(profileId, reason);
      return mut({ profileId, reason } as never);
    },
    [mut]
  );
}

export function useAdminBanUser() {
  const mut = useMutation(api.admin.banUser);
  return useCallback(
    async (profileId: string, banned = true) => {
      if (isApiProvider()) {
        return banned
          ? getAdminAdapter().users.ban(profileId)
          : getAdminAdapter().users.unban(profileId);
      }
      return mut({ profileId, banned } as never);
    },
    [mut]
  );
}

export function useAdminRequestPhoto() {
  const mut = useMutation(api.admin.requestProfilePhoto);
  return useCallback(
    async (profileId: string, message?: string) => {
      if (isApiProvider())
        return getAdminAdapter().users.requestPhoto(profileId);
      return mut({ profileId, message } as never);
    },
    [mut]
  );
}

export function useAdminDeleteUser() {
  const mut = useMutation(api.admin.deleteUser);
  return useCallback(
    async (profileId: string) => {
      if (isApiProvider()) return getAdminAdapter().users.delete(profileId);
      return mut({ profileId } as never);
    },
    [mut]
  );
}

export function useAdminSetRole() {
  const mut = useMutation(api.admin.setUserRole);
  return useCallback(
    async (profileId: string, role: string) => {
      if (isApiProvider())
        return getAdminAdapter().users.setRole(profileId, role);
      return mut({ profileId, role } as never);
    },
    [mut]
  );
}

export function useAdminCreateAnnouncement() {
  const mut = useMutation(api.admin.createAnnouncement);
  return useCallback(
    async (body: Record<string, unknown>) => {
      if (isApiProvider()) return getAdminAdapter().announcements.create(body);
      return mut(body as never);
    },
    [mut]
  );
}

export function useAdminUpdateReportStatus() {
  const mut = useMutation(api.moderation.updateReportStatus);
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
      if (isApiProvider()) {
        const body = {
          notes,
          priority: args.priority,
          resolution: args.resolution,
        };
        return args.status === "reviewed"
          ? getAdminAdapter().reports.resolve(args.reportId, body)
          : getAdminAdapter().reports.dismiss(args.reportId, body);
      }
      return mut({
        reportId: args.reportId,
        status: args.status,
        notes,
        priority: args.priority,
        resolution: args.resolution,
        adminNotes: args.adminNotes ?? notes,
      } as never);
    },
    [mut]
  );
}

export function useAdminEvcPending() {
  const convex = useSafeQuery(
    api.evcPayments.listPending,
    isApiProvider() ? "skip" : {}
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider()) return;
    let c = false;
    void getAdminAdapter()
      .evc.pending()
      .then((d) => {
        if (!c) setApiData(d);
      });
    return () => {
      c = true;
    };
  }, []);
  return isApiProvider() ? apiData : convex;
}

export function useAdminApproveEvc() {
  const mut = useMutation(api.evcPayments.approveProof);
  return useCallback(
    async (proofId: string) => {
      if (isApiProvider()) return getAdminAdapter().evc.approve(proofId);
      return mut({ proofId } as never);
    },
    [mut]
  );
}

export function useAdminRejectEvc() {
  const mut = useMutation(api.evcPayments.rejectProof);
  return useCallback(
    async (proofId: string, reason?: string) => {
      if (isApiProvider()) return getAdminAdapter().evc.reject(proofId, reason);
      return mut({ proofId, reason } as never);
    },
    [mut]
  );
}

export function useAdminUserDetail(profileId: string | null, enabled: boolean) {
  const convex = useSafeQuery(
    api.admin.getUserDetail,
    !isApiProvider() && enabled && profileId
      ? ({ profileId } as never)
      : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled || !profileId) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
      .users.detail(profileId)
      .then((d) => {
        if (!c) setApiData(d);
      });
    return () => {
      c = true;
    };
  }, [enabled, profileId]);
  return isApiProvider() ? apiData : convex;
}

export function useAdminUserActivity(
  profileId: string | null,
  enabled: boolean
) {
  const convex = useSafeQuery(
    api.admin.getUserActivity,
    !isApiProvider() && enabled && profileId
      ? ({ profileId } as never)
      : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled || !profileId) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
      .users.activity(profileId)
      .then((d) => {
        if (!c) setApiData(d);
      });
    return () => {
      c = true;
    };
  }, [enabled, profileId]);
  return isApiProvider() ? apiData : convex;
}

export function useAdminAdvisorReviewed() {
  const mut = useMutation(api.admin.setAdvisorReviewed);
  return useCallback(
    async (profileId: string, advisorReviewed: boolean) => {
      if (isApiProvider())
        return getAdminAdapter().users.advisorReviewed(
          profileId,
          advisorReviewed
        );
      return mut({ profileId, advisorReviewed } as never);
    },
    [mut]
  );
}

/** Prefer moderation adapter for member safety actions. */
export function useModerationBlock() {
  return useCallback(async (userId: string) => {
    return getModerationAdapter().blockUser(userId);
  }, []);
}

export function useClaimFirstAdmin() {
  const mut = useMutation(api.admin.claimFirstAdmin);
  return useCallback(
    async (args: { secret: string }) => {
      if (isApiProvider()) {
        throw new Error("Admin bootstrap claim is not available in API mode");
      }
      return mut(args as never);
    },
    [mut]
  );
}

export function useStaffInvitesList(enabled = true) {
  const convex = useSafeQuery(
    api.staffInvites.list,
    !isApiProvider() && enabled ? {} : "skip"
  );
  const [apiData, setApiData] = useState<unknown>(undefined);
  useEffect(() => {
    if (!isApiProvider() || !enabled) {
      setApiData(undefined);
      return;
    }
    let c = false;
    void getAdminAdapter()
      .staffInvites.list()
      .then((d) => {
        if (!c) {
          const items = Array.isArray(d)
            ? d
            : ((d as { items?: unknown[] })?.items ?? d);
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
  return isApiProvider() ? apiData : convex;
}

export function useCreateStaffInvite() {
  const mut = useMutation(api.staffInvites.create);
  return useCallback(
    async (args: { email: string }) => {
      if (isApiProvider())
        return getAdminAdapter().staffInvites.create(args) as Promise<{
          email: string;
        }>;
      return mut(args as never) as Promise<{ email: string }>;
    },
    [mut]
  );
}

export function useRevokeStaffInvite() {
  const mut = useMutation(api.staffInvites.revoke);
  return useCallback(
    async (args: { inviteId: string }) => {
      if (isApiProvider())
        return getAdminAdapter().staffInvites.revoke(args.inviteId);
      return mut(args as never);
    },
    [mut]
  );
}

export function useResendStaffInvite() {
  const mut = useMutation(api.staffInvites.resend);
  return useCallback(
    async (args: { inviteId: string }) => {
      if (isApiProvider()) {
        throw new Error("Staff invite resend is not available in API mode");
      }
      return mut(args as never);
    },
    [mut]
  );
}
