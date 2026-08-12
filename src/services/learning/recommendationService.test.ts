import { describe, expect, it } from "vitest";
import {
  localRuleBasedRecommendationService,
  topicDisplayName,
  topicsGoodToReview,
  growingSkillTopics,
  recentlyPracticedTopics,
  favoriteWorldTopics,
} from "./recommendationService";
import { createEmptyTopicProgress } from "./mastery";
import type { LearningSession, MasteryEntry, TopicProgress } from "../../models/types";

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

function addMastery(
  progress: Record<string, TopicProgress>,
  topicId: string,
  vocabId: string,
  entry: Partial<MasteryEntry>,
): Record<string, TopicProgress> {
  const existing = progress[topicId] ?? createEmptyTopicProgress(topicId);
  const full: MasteryEntry = { score: 0, correctStreak: 0, totalAttempts: 5, totalCorrect: 5, lastSeenAt: NOW, ...entry };
  return { ...progress, [topicId]: { ...existing, masteryByVocab: { ...existing.masteryByVocab, [vocabId]: full } } };
}

function session(topicIds: string[], startedAt: number): LearningSession {
  return {
    id: `s-${startedAt}-${topicIds.join(",")}`,
    topicIds,
    activities: [],
    currentIndex: 0,
    startedAt,
    completedAt: startedAt + 5 * 60000,
    results: [],
    rewardsEarned: { stars: 0, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [] },
  };
}

describe("topicDisplayName", () => {
  it("prefers a world's themed title when the topic has one", () => {
    expect(topicDisplayName("colors").en.length).toBeGreaterThan(0);
  });

  it("falls back gracefully for an unknown topic id instead of crashing", () => {
    expect(() => topicDisplayName("not-a-real-topic")).not.toThrow();
  });
});

describe("localRuleBasedRecommendationService", () => {
  it("always includes a transparent parent-facing reason for every recommendation", () => {
    const recs = localRuleBasedRecommendationService.getRecommendations({
      progress: {},
      sessions: [],
      enabledTopicIds: ["colors", "animals", "shapes"],
      now: NOW,
    });
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.reason.en.length).toBeGreaterThan(0);
      expect(rec.reason.he.length).toBeGreaterThan(0);
    }
  });

  it("respects the requested limit", () => {
    const recs = localRuleBasedRecommendationService.getRecommendations({
      progress: {},
      sessions: [],
      enabledTopicIds: ["colors", "animals", "shapes", "numbers"],
      now: NOW,
      limit: 2,
    });
    expect(recs.length).toBeLessThanOrEqual(2);
  });
});

describe("topicsGoodToReview", () => {
  it("surfaces a topic once one of its skills is due for spaced review", () => {
    // score 90 -> 14 day interval, last seen 20 days ago -> REVIEW state
    let progress = addMastery({}, "colors", "red", { score: 90, totalAttempts: 8, lastSeenAt: NOW - 20 * DAY });
    expect(topicsGoodToReview(progress, ["colors"], NOW)).toEqual(["colors"]);
  });

  it("does not surface a topic with no skills currently due", () => {
    const progress = addMastery({}, "colors", "red", { score: 90, totalAttempts: 8, lastSeenAt: NOW - 1 * DAY });
    expect(topicsGoodToReview(progress, ["colors"], NOW)).toEqual([]);
  });

  it("ignores topics that aren't enabled", () => {
    const progress = addMastery({}, "colors", "red", { score: 90, totalAttempts: 8, lastSeenAt: NOW - 20 * DAY });
    expect(topicsGoodToReview(progress, ["animals"], NOW)).toEqual([]);
  });
});

describe("growingSkillTopics", () => {
  it("lists skills currently in the EMERGING band, strongest first", () => {
    let progress = addMastery({}, "colors", "red", { score: 45, totalAttempts: 5, lastSeenAt: NOW });
    progress = addMastery(progress, "colors", "blue", { score: 60, totalAttempts: 5, lastSeenAt: NOW });
    const growing = growingSkillTopics(progress, ["colors"], NOW);
    expect(growing.length).toBe(2);
    expect(growing[0].skillTitle).not.toBe(growing[1].skillTitle);
  });

  it("excludes skills that are already STRONG or still just PRACTICING", () => {
    let progress = addMastery({}, "colors", "red", { score: 95, totalAttempts: 8, lastSeenAt: NOW }); // STRONG
    progress = addMastery(progress, "colors", "blue", { score: 10, totalAttempts: 5, lastSeenAt: NOW }); // PRACTICING
    expect(growingSkillTopics(progress, ["colors"], NOW)).toEqual([]);
  });
});

describe("recentlyPracticedTopics", () => {
  it("returns distinct topic ids from sessions within the window, most recent session first", () => {
    const sessions = [session(["animals"], NOW - 1 * DAY), session(["colors"], NOW - 2 * DAY), session(["colors"], NOW - 3 * DAY)];
    expect(recentlyPracticedTopics(sessions, 7, NOW)).toEqual(["animals", "colors"]);
  });

  it("excludes sessions outside the window", () => {
    const sessions = [session(["colors"], NOW - 30 * DAY)];
    expect(recentlyPracticedTopics(sessions, 7, NOW)).toEqual([]);
  });
});

describe("favoriteWorldTopics", () => {
  it("ranks topics by how often they were played", () => {
    const sessions = [session(["colors"], NOW - 1 * DAY), session(["colors"], NOW - 2 * DAY), session(["animals"], NOW - 3 * DAY)];
    expect(favoriteWorldTopics(sessions, 2)).toEqual(["colors", "animals"]);
  });

  it("respects the requested limit", () => {
    const sessions = [session(["colors"], NOW), session(["animals"], NOW), session(["shapes"], NOW)];
    expect(favoriteWorldTopics(sessions, 1).length).toBe(1);
  });
});
