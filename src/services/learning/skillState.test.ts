import { describe, expect, it } from "vitest";
import { deriveSkillState, isDueForReview, spacedReviewIntervalDays } from "./skillState";
import type { MasteryEntry } from "../../models/types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-08-12T12:00:00Z").getTime();

function entry(overrides: Partial<MasteryEntry>): MasteryEntry {
  return { score: 0, correctStreak: 0, totalAttempts: 0, totalCorrect: 0, lastSeenAt: NOW, ...overrides };
}

describe("deriveSkillState", () => {
  it("is NOT_INTRODUCED when there's no entry or zero attempts", () => {
    expect(deriveSkillState(undefined, NOW)).toBe("NOT_INTRODUCED");
    expect(deriveSkillState(entry({ totalAttempts: 0 }), NOW)).toBe("NOT_INTRODUCED");
  });

  it("is INTRODUCED for the first couple of attempts regardless of score", () => {
    expect(deriveSkillState(entry({ totalAttempts: 1, score: 14 }), NOW)).toBe("INTRODUCED");
    expect(deriveSkillState(entry({ totalAttempts: 2, score: 50 }), NOW)).toBe("INTRODUCED");
  });

  it("is PRACTICING once attempts pile up but the score is still low", () => {
    expect(deriveSkillState(entry({ totalAttempts: 5, score: 20, lastSeenAt: NOW }), NOW)).toBe("PRACTICING");
  });

  it("is EMERGING in the middle score band, STRONG above it", () => {
    expect(deriveSkillState(entry({ totalAttempts: 5, score: 50, lastSeenAt: NOW }), NOW)).toBe("EMERGING");
    expect(deriveSkillState(entry({ totalAttempts: 5, score: 90, lastSeenAt: NOW }), NOW)).toBe("STRONG");
  });

  it("never uses a punitive state name - the full set is exactly the six documented states", () => {
    const allowed = new Set(["NOT_INTRODUCED", "INTRODUCED", "PRACTICING", "EMERGING", "STRONG", "REVIEW"]);
    const samples = [
      deriveSkillState(undefined, NOW),
      deriveSkillState(entry({ totalAttempts: 1 }), NOW),
      deriveSkillState(entry({ totalAttempts: 10, score: 10, lastSeenAt: NOW }), NOW),
      deriveSkillState(entry({ totalAttempts: 10, score: 95, lastSeenAt: NOW - 30 * DAY }), NOW),
    ];
    for (const s of samples) expect(allowed.has(s)).toBe(true);
  });

  it("resurfaces a strong-but-stale skill as REVIEW instead of silently staying STRONG", () => {
    const stale = entry({ totalAttempts: 10, score: 90, lastSeenAt: NOW - 20 * DAY }); // 90 -> 14 day interval
    expect(deriveSkillState(stale, NOW)).toBe("REVIEW");
  });

  it("a skill practiced within its review window keeps its normal state", () => {
    const fresh = entry({ totalAttempts: 10, score: 90, lastSeenAt: NOW - 2 * DAY });
    expect(deriveSkillState(fresh, NOW)).toBe("STRONG");
  });
});

describe("spacedReviewIntervalDays", () => {
  it("gives stronger skills longer before they're due for review", () => {
    const veryStrong = spacedReviewIntervalDays(95);
    const strong = spacedReviewIntervalDays(65);
    const emerging = spacedReviewIntervalDays(35);
    const weak = spacedReviewIntervalDays(10);
    expect(veryStrong).toBeGreaterThan(strong);
    expect(strong).toBeGreaterThan(emerging);
    expect(emerging).toBeGreaterThan(weak);
  });
});

describe("isDueForReview", () => {
  it("is false for a never-attempted entry", () => {
    expect(isDueForReview(entry({ totalAttempts: 0, lastSeenAt: NOW - 100 * DAY }), NOW)).toBe(false);
  });

  it("is false right after practicing, true once the interval has passed", () => {
    const e = entry({ totalAttempts: 5, score: 50, lastSeenAt: NOW }); // interval = 3 days
    expect(isDueForReview(e, NOW)).toBe(false);
    expect(isDueForReview({ ...e, lastSeenAt: NOW - 4 * DAY }, NOW)).toBe(true);
  });
});
