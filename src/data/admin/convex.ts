import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { AdminAdapter } from "./types";

export const convexAdmin: AdminAdapter = {
  async stats() {
    const client = getConvexClient();
    return client.query(api.admin.getStats, {});
  },
  async analytics() {
    const client = getConvexClient();
    return client.query(api.admin.getAnalytics, {});
  },
  async activity() {
    const client = getConvexClient();
    return client.query(api.admin.getAnalytics, {});
  },
  async siteMetrics() {
    const client = getConvexClient();
    return client.query(api.admin.getStats, {});
  },
  async rebuildSiteMetrics() {
    return { ok: false, reason: "not_exposed_on_convex_client" };
  },
  users: {
    async list(opts) {
      const client = getConvexClient();
      return client.query(api.admin.getAllUsers, (opts ?? {}) as never);
    },
    async detail(id) {
      const client = getConvexClient();
      return client.query(api.admin.getUserDetail, { profileId: id } as never);
    },
    async activity(id) {
      const client = getConvexClient();
      return client.query(api.admin.getUserActivity, {
        profileId: id,
      } as never);
    },
    async approve(id) {
      const client = getConvexClient();
      return client.mutation(api.admin.approveUser, { profileId: id } as never);
    },
    async reject(id, reason) {
      const client = getConvexClient();
      return client.mutation(api.admin.rejectUser, {
        profileId: id,
        reason,
      } as never);
    },
    async ban(id) {
      const client = getConvexClient();
      return client.mutation(api.admin.banUser, {
        profileId: id,
        banned: true,
      } as never);
    },
    async unban(id) {
      const client = getConvexClient();
      return client.mutation(api.admin.banUser, {
        profileId: id,
        banned: false,
      } as never);
    },
    async requestPhoto(id) {
      const client = getConvexClient();
      return client.mutation(api.admin.requestProfilePhoto, {
        profileId: id,
      } as never);
    },
    async delete(id) {
      const client = getConvexClient();
      return client.mutation(api.admin.deleteUser, { profileId: id } as never);
    },
    async setRole(id, role) {
      const client = getConvexClient();
      return client.mutation(api.admin.setUserRole, {
        profileId: id,
        role,
      } as never);
    },
    async advisorReviewed(id, reviewed) {
      const client = getConvexClient();
      return client.mutation(api.admin.setAdvisorReviewed, {
        profileId: id,
        advisorReviewed: reviewed,
      } as never);
    },
  },
  reports: {
    async list() {
      const client = getConvexClient();
      return client.query(api.moderation.listReports, {});
    },
    async resolve(id, body) {
      const client = getConvexClient();
      return client.mutation(api.moderation.updateReportStatus, {
        reportId: id,
        status: "reviewed",
        ...body,
      } as never);
    },
    async dismiss(id, body) {
      const client = getConvexClient();
      return client.mutation(api.moderation.updateReportStatus, {
        reportId: id,
        status: "dismissed",
        ...body,
      } as never);
    },
  },
  payments: {
    async list(opts) {
      const client = getConvexClient();
      return client.query(api.admin.getAllPayments, (opts ?? {}) as never);
    },
    async stats() {
      return this.list();
    },
    async quarantine() {
      return [];
    },
  },
  evc: {
    async pending() {
      const client = getConvexClient();
      return client.query(api.evcPayments.listPending, {});
    },
    async approve(id) {
      const client = getConvexClient();
      return client.mutation(api.evcPayments.approveProof, {
        proofId: id,
      } as never);
    },
    async reject(id, reason) {
      const client = getConvexClient();
      return client.mutation(api.evcPayments.rejectProof, {
        proofId: id,
        reason,
      } as never);
    },
    async count() {
      const client = getConvexClient();
      try {
        return await client.query(api.evcPayments.pendingCount, {});
      } catch {
        return { count: 0 };
      }
    },
  },
  announcements: {
    async list() {
      return [];
    },
    async create(body) {
      const client = getConvexClient();
      return client.mutation(api.admin.createAnnouncement, body as never);
    },
    async send() {
      return { ok: true };
    },
    async schedule() {
      return { ok: true };
    },
  },
  async auditLogs(opts) {
    const client = getConvexClient();
    return client.query(api.admin.getAuditLogs, (opts ?? {}) as never);
  },
  staffInvites: {
    async list() {
      const client = getConvexClient();
      return client.query(api.staffInvites.list, {});
    },
    async create(body) {
      const client = getConvexClient();
      return client.mutation(api.staffInvites.create, body as never);
    },
    async revoke(id) {
      const client = getConvexClient();
      return client.mutation(api.staffInvites.revoke, { inviteId: id } as never);
    },
    async getByToken(token) {
      const client = getConvexClient();
      return client.query(api.staffInvites.getByToken, { token } as never);
    },
    async accept(token, body) {
      const client = getConvexClient();
      return client.mutation(api.staffInvites.accept, {
        token,
        ...body,
      } as never);
    },
  },
};
