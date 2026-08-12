import { describe, expect, it } from "vitest";
import { goalMastery, isGoalComplete, GOAL_COMPLETE_THRESHOLD } from "./learningGoal";
import { createEmptyTopicProgress } from "./mastery";
import type { TopicProgress } from "../../models/types";

describe("goalMastery", () => {
  it("reads the topic's overall mastery for the goal's topic", () => {
    const progress: Record<string, TopicProgress> = {
      animals: { ...createEmptyTopicProgress("animals"), overallMastery: 42 },
    };
    expect(goalMastery({ topicId: "animals", setAt: 0 }, progress)).toBe(42);
  });

  it("is 0 for a topic that hasn't been played at all", () => {
    expect(goalMastery({ topicId: "animals", setAt: 0 }, {})).toBe(0);
  });
});

describe("isGoalComplete", () => {
  it("is not complete below the threshold", () => {
    const progress: Record<string, TopicProgress> = {
      animals: { ...createEmptyTopicProgress("animals"), overallMastery: GOAL_COMPLETE_THRESHOLD - 1 },
    };
    expect(isGoalComplete({ topicId: "animals", setAt: 0 }, progress)).toBe(false);
  });

  it("is complete once overall mastery reaches the threshold", () => {
    const progress: Record<string, TopicProgress> = {
      animals: { ...createEmptyTopicProgress("animals"), overallMastery: GOAL_COMPLETE_THRESHOLD },
    };
    expect(isGoalComplete({ topicId: "animals", setAt: 0 }, progress)).toBe(true);
  });
});
