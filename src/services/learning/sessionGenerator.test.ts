import { describe, expect, it } from "vitest";
import { activityCountForDuration, buildSession } from "./sessionGenerator";

describe("activityCountForDuration", () => {
  it("gives a 5-10 minute session a handful of activities, never zero", () => {
    expect(activityCountForDuration(5)).toBeGreaterThanOrEqual(3);
    expect(activityCountForDuration(10)).toBeGreaterThan(activityCountForDuration(5));
    expect(activityCountForDuration(15)).toBeGreaterThan(activityCountForDuration(10));
  });
});

describe("buildSession", () => {
  it("produces the expected number of activities for the requested duration", () => {
    const session = buildSession({ topicIds: ["colors", "animals"], durationMinutes: 10, progressByTopic: {}, seed: 42 });
    expect(session.activities.length).toBe(activityCountForDuration(10));
  });

  it("falls back to colors when no valid topic is provided", () => {
    const session = buildSession({ topicIds: ["not-a-real-topic"], durationMinutes: 5, progressByTopic: {}, seed: 1 });
    expect(session.activities.length).toBeGreaterThan(0);
    expect(session.activities.every((a) => a.topicId === "colors")).toBe(true);
  });

  it("is deterministic when given the same seed", () => {
    const a = buildSession({ topicIds: ["colors", "shapes"], durationMinutes: 10, progressByTopic: {}, seed: 99 });
    const b = buildSession({ topicIds: ["colors", "shapes"], durationMinutes: 10, progressByTopic: {}, seed: 99 });
    expect(a.activities.map((x) => x.type)).toEqual(b.activities.map((x) => x.type));
    expect(a.activities.map((x) => x.correctIds)).toEqual(b.activities.map((x) => x.correctIds));
  });

  it("uses a fixed difficulty override instead of the per-topic adaptive level when provided", () => {
    const session = buildSession({
      topicIds: ["colors"],
      durationMinutes: 5,
      progressByTopic: { colors: { topicId: "colors", masteryByVocab: {}, overallMastery: 0, activitiesCompleted: 0, difficultyLevel: 3, recentCorrectStreak: 0, recentIncorrectStreak: 0 } },
      difficultyOverride: 1,
      seed: 3,
    });
    expect(session.activities.every((activity) => activity.difficulty === 1)).toBe(true);
  });
});
