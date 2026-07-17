import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyPhotoStreakContribution,
  normalizePhotoStreak,
  viewPhotoStreak,
} from "./photo-streak";

describe("photo streak", () => {
  it("starts at 1 when both send a photo the same day", () => {
    const day = new Date("2026-07-17T12:00:00.000Z");
    let state = normalizePhotoStreak({});
    state = applyPhotoStreakContribution(state, "a", "b", day);
    assert.equal(state.streakCount, 0);
    state = applyPhotoStreakContribution(state, "b", "a", day);
    assert.equal(state.streakCount, 1);
    assert.equal(state.streakLastDay, "2026-07-17");
  });

  it("increments across consecutive days", () => {
    const d1 = new Date("2026-07-17T12:00:00.000Z");
    const d2 = new Date("2026-07-18T12:00:00.000Z");
    let state = normalizePhotoStreak({});
    state = applyPhotoStreakContribution(state, "a", "b", d1);
    state = applyPhotoStreakContribution(state, "b", "a", d1);
    state = applyPhotoStreakContribution(state, "a", "b", d2);
    state = applyPhotoStreakContribution(state, "b", "a", d2);
    assert.equal(state.streakCount, 2);
    assert.equal(state.longestStreak, 2);
  });

  it("resets after a missed day", () => {
    const d1 = new Date("2026-07-17T12:00:00.000Z");
    const d3 = new Date("2026-07-19T12:00:00.000Z");
    let state = normalizePhotoStreak({});
    state = applyPhotoStreakContribution(state, "a", "b", d1);
    state = applyPhotoStreakContribution(state, "b", "a", d1);
    state = applyPhotoStreakContribution(state, "a", "b", d3);
    state = applyPhotoStreakContribution(state, "b", "a", d3);
    assert.equal(state.streakCount, 1);
  });

  it("marks at-risk when yesterday completed but today not mutual yet", () => {
    const today = new Date("2026-07-18T20:00:00.000Z");
    const state = normalizePhotoStreak({
      streakCount: 3,
      longestStreak: 5,
      streakLastDay: "2026-07-17",
      streakPendingDay: "2026-07-18",
      streakPendingUserIds: ["a"],
    });
    const view = viewPhotoStreak(state, "a", "b", today);
    assert.equal(view.count, 3);
    assert.equal(view.atRisk, true);
    assert.equal(view.youSentToday, true);
    assert.equal(view.partnerSentToday, false);
  });
});
