import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { SupportAdapter } from "./types";

export const convexSupport: SupportAdapter = {
  async listMine() {
    const client = getConvexClient();
    return client.query(api.supportContacts.listMySupportMessages, {});
  },
  async getMine(contactId) {
    const list = (await this.listMine()) as Array<{ _id?: string }> | null;
    return list?.find((c) => c._id === contactId) ?? null;
  },
  async create(body) {
    const client = getConvexClient();
    return client.mutation(api.supportContacts.sendSupportMessage, body as never);
  },
  async replyAsMember(contactId, message) {
    const client = getConvexClient();
    return client.mutation(api.supportContacts.replyAsMember, {
      contactId,
      message,
    } as never);
  },
  admin: {
    async list() {
      const client = getConvexClient();
      return client.query(api.supportContacts.listSupportContacts, {});
    },
    async get(contactId) {
      const list = (await this.list()) as Array<{ _id?: string }> | null;
      return list?.find((c) => c._id === contactId) ?? null;
    },
    async reply(contactId, message) {
      const client = getConvexClient();
      return client.mutation(api.supportContacts.replyAsAdmin, {
        contactId,
        message,
      } as never);
    },
    async updateStatus(contactId, status) {
      const client = getConvexClient();
      return client.mutation(api.supportContacts.updateSupportContactStatus, {
        contactId,
        status,
      } as never);
    },
  },
  async sendPublicContact(body) {
    const client = getConvexClient();
    return client.action(api.contact.sendContactMessage, body as never);
  },
};
