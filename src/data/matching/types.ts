export type MatchingAdapter = {
  getMatches(filters?: Record<string, unknown>): Promise<unknown>;
  getMyMatches(list?: string): Promise<unknown>;
  getMatchLists(filters?: Record<string, unknown>): Promise<unknown>;
  getHomeFeed(): Promise<unknown>;
  getCompatibilityBreakdown(userId: string): Promise<unknown>;
  likeUser(userId: string, action?: "like" | "pass" | "shortlist"): Promise<unknown>;
  markMatchSeen(matchId: string): Promise<unknown>;
  archiveMatch(matchId: string, archived?: boolean): Promise<unknown>;
};

export const MATCHING_METHOD_NAMES = [
  "getMatches",
  "getMyMatches",
  "getMatchLists",
  "getHomeFeed",
  "getCompatibilityBreakdown",
  "likeUser",
  "markMatchSeen",
  "archiveMatch",
] as const;
