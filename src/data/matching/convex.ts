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
  async getHomeFeed() {
    const client = getConvexClient();
    const [matches, lists, mutuals] = await Promise.all([
      client.query(api.matches.getMatches, {} as never).catch(() => []),
      client.query(api.matches.getMatchLists, {} as never).catch(() => ({
        likedYou: [],
      })),
      client.query(api.matches.getMyMatches, {} as never).catch(() => []),
    ]);
    const discover = Array.isArray(matches) ? matches : [];
    const likedYou = Array.isArray(
      (lists as { likedYou?: unknown })?.likedYou
    )
      ? ((lists as { likedYou: unknown[] }).likedYou as unknown[])
      : [];
    const mutualList = Array.isArray(mutuals) ? mutuals : [];
    const dayKey = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < dayKey.length; i += 1) hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
    const dailyMatch =
      discover.length > 0
        ? discover[hash % discover.length] ?? discover[0]
        : null;
    return {
      dayKey,
      isPremium: true,
      dailyMatch,
      likedYouCount: likedYou.length,
      likedYouPreview: likedYou.slice(0, 3),
      likedYouLocked: false,
      newMutualCount: mutualList.filter(
        (m) => !!(m as { isNew?: boolean })?.isNew
      ).length,
      pendingChatCount: mutualList.filter(
        (m) => !!(m as { isNew?: boolean })?.isNew
      ).length,
      discoverCount: discover.length,
      recentMutuals: mutualList.slice(0, 3).map((m) => {
        const row = m as {
          matchId?: string;
          conversationId?: string;
          score?: number;
          isNew?: boolean;
          profile?: { name?: string; imageUrl?: string | null };
        };
        return {
          matchId: row.matchId ?? "",
          conversationId: row.conversationId ?? null,
          score: row.score ?? 0,
          isNew: !!row.isNew,
          name: row.profile?.name ?? "Member",
          imageUrl: row.profile?.imageUrl ?? null,
        };
      }),
    };
  },
  async getCompatibilityBreakdown(userId) {
    const client = getConvexClient();
    return client.query(api.matches.getCompatibilityBreakdown, {
      userId,
    } as never);
  },
  async getPrivateRevealStatus() {
    return {
      hasPrivatePhotos: false,
      canReveal: false,
      revealed: [],
      remainingReveals: 0,
      unreaveledCount: 0,
      privatePhotoCount: 0,
      maxReveals: 0,
      usedReveals: 0,
    };
  },
  async revealPrivatePhoto() {
    throw new Error("Private photo reveal requires API mode");
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
