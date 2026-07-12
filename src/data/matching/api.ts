import { apiClient } from "../api-client";
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

export const apiMatching: MatchingAdapter = {
  async getMatches(filters) {
    return apiClient.get(`/matches/discover${toQuery(filters)}`);
  },
  async getMyMatches(list = "active") {
    return apiClient.get(`/matches/mutual?list=${encodeURIComponent(list)}`);
  },
  async getMatchLists(filters) {
    return apiClient.get(`/matches/lists${toQuery(filters)}`);
  },
  async getCompatibilityBreakdown(userId) {
    return apiClient.get(`/matches/${encodeURIComponent(userId)}/breakdown`);
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
