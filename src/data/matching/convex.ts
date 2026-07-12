import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { MatchingAdapter } from "./types";

export const convexMatching: MatchingAdapter = {
  async getMatches(filters) {
    const client = getConvexClient();
    return client.query(api.matches.getMatches, (filters ?? {}) as never);
  },
  async getMyMatches() {
    const client = getConvexClient();
    return client.query(api.matches.getMyMatches, {});
  },
  async getMatchLists(filters) {
    const client = getConvexClient();
    return client.query(api.matches.getMatchLists, (filters ?? {}) as never);
  },
  async getCompatibilityBreakdown(userId) {
    const client = getConvexClient();
    return client.query(api.matches.getCompatibilityBreakdown, {
      userId,
    } as never);
  },
  async likeUser(userId) {
    const client = getConvexClient();
    return client.mutation(api.matches.likeUser, { userId } as never);
  },
  async markMatchSeen(matchId) {
    const client = getConvexClient();
    return client.mutation(api.matches.markMatchSeen, { matchId } as never);
  },
  async archiveMatch(matchId, archived = true) {
    const client = getConvexClient();
    return client.mutation(api.matches.archiveMatch, {
      matchId,
      archived,
    } as never);
  },
};
