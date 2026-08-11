import { describe, expect, it } from "vitest";
import {
  accuracyForSessions,
  activitiesCompletedForSessions,
  groupSessionsByRecency,
  minutesForSessions,
  recommendTopics,
  topicsPracticed,
} from "./dashboardStats";
import type { ActivityResult, LearningSession } from "../../models/types";

function makeSession(overrides: Partial<LearningSession>): LearningSession {
  return {
    id: "s1",
    topicIds: ["colors"],
    activities: [],
    currentIndex: 0,
    startedAt: Date.now(),
    completedAt: Date.now() + 5 * 60000,
    results: [],
    rewardsEarned: { stars: 0, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [] },
    ...overrides,
  };
}

describe("minutesForSessions", () => {
  it("sums the duration of each session in minutes", () => {
    const now = Date.now();
    const sessions = [makeSession({ startedAt: now, completedAt: now + 5 * 60000 }), makeSession({ startedAt: now, completedAt: now + 3 * 60000 })];
    expect(minutesForSessions(sessions)).toBe(8);
  });
});

describe("topicsPracticed", () => {
  it("returns the unique set of topics across sessions", () => {
    const sessions = [makeSession({ topicIds: ["colors", "animals"] }), makeSession({ topicIds: ["colors"] })];
    expect(topicsPracticed(sessions).sort()).toEqual(["animals", "colors"]);
  });
});

describe("accuracyForSessions", () => {
  it("returns 0 when there are no results yet", () => {
    expect(accuracyForSessions([makeSession({ results: [] })])).toBe(0);
  });

  it("computes the percentage of correct graded results", () => {
    const results: ActivityResult[] = [
      { activityId: "a", topicId: "colors", vocabId: "red", correct: true, attempts: 1, hintsUsed: 0, responseTimeMs: 1, timestamp: 1, graded: true },
      { activityId: "b", topicId: "colors", vocabId: "blue", correct: false, attempts: 3, hintsUsed: 2, responseTimeMs: 1, timestamp: 2, graded: true },
      { activityId: "c", topicId: "colors", vocabId: "green", correct: true, attempts: 1, hintsUsed: 0, responseTimeMs: 1, timestamp: 3, graded: true },
      { activityId: "d", topicId: "colors", vocabId: "pink", correct: true, attempts: 1, hintsUsed: 0, responseTimeMs: 1, timestamp: 4, graded: true },
    ];
    expect(accuracyForSessions([makeSession({ results })])).toBe(75);
  });

  it("ignores ungraded results (MATCH/MEMORY/SORT always report correct:true) so they can't inflate accuracy", () => {
    const results: ActivityResult[] = [
      { activityId: "a", topicId: "colors", vocabId: "red", correct: true, attempts: 1, hintsUsed: 0, responseTimeMs: 1, timestamp: 1, graded: true },
      { activityId: "b", topicId: "colors", vocabId: "blue", correct: false, attempts: 3, hintsUsed: 2, responseTimeMs: 1, timestamp: 2, graded: true },
      // A 4-pair memory game "completing" shouldn't drag a 50% quiz score up to 83%.
      ...Array.from({ length: 4 }, (_, i) => ({
        activityId: "memory-1",
        topicId: "colors",
        vocabId: `pair-${i}`,
        correct: true,
        attempts: 1,
        hintsUsed: 0,
        responseTimeMs: 1,
        timestamp: 10 + i,
        graded: false,
      })),
    ];
    expect(accuracyForSessions([makeSession({ results })])).toBe(50);
  });

  it("falls back to all results if nothing graded has been played yet", () => {
    const results: ActivityResult[] = [
      { activityId: "memory-1", topicId: "colors", vocabId: "pair-0", correct: true, attempts: 1, hintsUsed: 0, responseTimeMs: 1, timestamp: 1, graded: false },
    ];
    expect(accuracyForSessions([makeSession({ results })])).toBe(100);
  });
});

describe("activitiesCompletedForSessions", () => {
  it("counts distinct activities, not one entry per vocab result", () => {
    const results: ActivityResult[] = [
      { activityId: "find-1", topicId: "colors", vocabId: "red", correct: true, attempts: 1, hintsUsed: 0, responseTimeMs: 1, timestamp: 1, graded: true },
      ...Array.from({ length: 4 }, (_, i) => ({
        activityId: "memory-1",
        topicId: "colors",
        vocabId: `pair-${i}`,
        correct: true,
        attempts: 1,
        hintsUsed: 0,
        responseTimeMs: 1,
        timestamp: 10 + i,
        graded: false,
      })),
    ];
    // One FIND activity + one MEMORY activity (with 4 pairs) = 2 activities, not 5.
    expect(activitiesCompletedForSessions([makeSession({ results })])).toBe(2);
  });
});

describe("groupSessionsByRecency", () => {
  it("buckets sessions into today / yesterday / earlier this week", () => {
    const now = new Date("2026-08-11T12:00:00Z").getTime();
    const sessions = [
      makeSession({ id: "today", startedAt: now }),
      makeSession({ id: "yesterday", startedAt: now - 86400000 }),
      makeSession({ id: "3-days-ago", startedAt: now - 3 * 86400000 }),
      makeSession({ id: "2-weeks-ago", startedAt: now - 14 * 86400000 }),
    ];
    const grouped = groupSessionsByRecency(sessions, now);
    expect(grouped.today.map((s) => s.id)).toEqual(["today"]);
    expect(grouped.yesterday.map((s) => s.id)).toEqual(["yesterday"]);
    expect(grouped.earlierThisWeek.map((s) => s.id)).toEqual(["3-days-ago"]);
  });
});

describe("recommendTopics", () => {
  it("prioritizes topics that need practice over ones never tried", () => {
    const progress = {
      colors: { topicId: "colors", masteryByVocab: {}, overallMastery: 20, activitiesCompleted: 5, difficultyLevel: 1 as const, recentCorrectStreak: 0, recentIncorrectStreak: 0 },
    };
    const recs = recommendTopics(progress, ["colors", "animals", "shapes"], 2);
    expect(recs[0].topicId).toBe("colors");
    expect(recs[0].reason).toBe("needs_practice");
  });

  it("never recommends a disabled topic", () => {
    const recs = recommendTopics({}, ["colors"], 5);
    expect(recs.every((rec) => rec.topicId === "colors")).toBe(true);
  });
});
