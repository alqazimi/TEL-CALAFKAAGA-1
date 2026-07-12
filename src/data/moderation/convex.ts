import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { ModerationAdapter } from "./types";

export const convexModeration: ModerationAdapter = {
  async blockUser(userId, reason) {
    const client = getConvexClient();
    return client.mutation(api.moderation.blockUser, {
      userId,
      reason,
    } as never);
  },
  async unblockUser(userId) {
    const client = getConvexClient();
    return client.mutation(api.moderation.unblockUser, { userId } as never);
  },
  async reportUser(body) {
    const client = getConvexClient();
    return client.mutation(api.moderation.reportUser, body as never);
  },
  async listMyBlocks() {
    const client = getConvexClient();
    return client.query(api.moderation.listMyBlocks, {});
  },
};
