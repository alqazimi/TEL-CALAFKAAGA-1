import { apiClient, ApiClientError } from "../api-client";
import type { MatchingAdapter } from "./types";

function toQuery(filters?: Record<string, unknown>): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

/** Unpaid / gated reads should not crash the app shell — return empty data. */
function isPaidGateError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    error.status === 403 &&
    /paid access required/i.test(error.message)
  );
}

export const apiMatching: MatchingAdapter = {
  async getMatches(filters) {
    try {
      return await apiClient.get(`/matches/discover${toQuery(filters)}`);
    } catch (error) {
      if (isPaidGateError(error)) return [];
      throw error;
    }
  },
  async getMyMatches(list = "active") {
    try {
      return await apiClient.get(
        `/matches/mutual?list=${encodeURIComponent(list)}`
      );
    } catch (error) {
      if (isPaidGateError(error)) return [];
      throw error;
    }
  },
  async getMatchLists(filters) {
    try {
      return await apiClient.get(`/matches/lists${toQuery(filters)}`);
    } catch (error) {
      if (isPaidGateError(error)) {
        return { shortlist: [], liked: [], likedYou: [], passed: [] };
      }
      throw error;
    }
  },
  async getCompatibilityBreakdown(userId) {
    try {
      return await apiClient.get(
        `/matches/${encodeURIComponent(userId)}/breakdown`
      );
    } catch (error) {
      if (isPaidGateError(error)) return null;
      throw error;
    }
  },
  async likeUser(userId, action = "like") {
    return apiClient.post(`/matches/${encodeURIComponent(userId)}/action`, {
      action,
    });
  },
  async markMatchSeen(matchId) {
    return apiClient.post(`/matches/${encodeURIComponent(matchId)}/seen`, {});
  },
  async archiveMatch(matchId, archived = true) {
    return apiClient.post(`/matches/${encodeURIComponent(matchId)}/archive`, {
      archived,
    });
  },
};
