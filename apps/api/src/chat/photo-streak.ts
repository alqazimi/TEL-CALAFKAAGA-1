import { utcDayKey } from "../matching/highlights";

export type PhotoStreakState = {
  streakCount: number;
  longestStreak: number;
  streakLastDay: string | null;
  streakPendingDay: string | null;
  streakPendingUserIds: string[];
};

export type PhotoStreakView = {
  count: number;
  longest: number;
  atRisk: boolean;
  youSentToday: boolean;
  partnerSentToday: boolean;
  bothSentToday: boolean;
};

function previousUtcDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function asUserIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function normalizePhotoStreak(input: {
  streakCount?: number | null;
  longestStreak?: number | null;
  streakLastDay?: string | null;
  streakPendingDay?: string | null;
  streakPendingUserIds?: unknown;
}): PhotoStreakState {
  return {
    streakCount: Math.max(0, input.streakCount ?? 0),
    longestStreak: Math.max(0, input.longestStreak ?? 0),
    streakLastDay: input.streakLastDay ?? null,
    streakPendingDay: input.streakPendingDay ?? null,
    streakPendingUserIds: asUserIds(input.streakPendingUserIds),
  };
}

/**
 * Apply a photo contribution for today. Both match partners must send a
 * chat photo on the same UTC day to advance the streak (Snapchat-style).
 */
export function applyPhotoStreakContribution(
  state: PhotoStreakState,
  senderUserId: string,
  otherUserId: string,
  now = new Date()
): PhotoStreakState {
  const today = utcDayKey(now);
  const yesterday = previousUtcDayKey(today);
  let streakCount = state.streakCount;
  let longestStreak = state.longestStreak;
  let streakLastDay = state.streakLastDay;

  if (streakLastDay && streakLastDay !== today && streakLastDay !== yesterday) {
    streakCount = 0;
    streakLastDay = null;
  }

  let pendingDay = state.streakPendingDay;
  let pending = [...state.streakPendingUserIds];
  if (pendingDay !== today) {
    pendingDay = today;
    pending = [];
  }
  if (!pending.includes(senderUserId)) {
    pending.push(senderUserId);
  }

  const bothSent =
    pending.includes(senderUserId) && pending.includes(otherUserId);

  if (bothSent && streakLastDay !== today) {
    if (streakLastDay === yesterday) {
      streakCount += 1;
    } else {
      streakCount = 1;
    }
    streakLastDay = today;
    if (streakCount > longestStreak) longestStreak = streakCount;
  }

  return {
    streakCount,
    longestStreak,
    streakLastDay,
    streakPendingDay: pendingDay,
    streakPendingUserIds: pending,
  };
}

export function viewPhotoStreak(
  state: PhotoStreakState,
  viewerUserId: string,
  partnerUserId: string,
  now = new Date()
): PhotoStreakView {
  const today = utcDayKey(now);
  const yesterday = previousUtcDayKey(today);
  let count = state.streakCount;
  if (
    state.streakLastDay &&
    state.streakLastDay !== today &&
    state.streakLastDay !== yesterday
  ) {
    count = 0;
  }

  const pending =
    state.streakPendingDay === today ? state.streakPendingUserIds : [];
  const youSentToday = pending.includes(viewerUserId);
  const partnerSentToday = pending.includes(partnerUserId);
  const bothSentToday = youSentToday && partnerSentToday;
  const atRisk =
    count > 0 && state.streakLastDay === yesterday && !bothSentToday;

  return {
    count,
    longest: Math.max(state.longestStreak, count),
    atRisk,
    youSentToday,
    partnerSentToday,
    bothSentToday,
  };
}
