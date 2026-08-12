import { describe, expect, it } from "vitest";
import { buildAdventurePlan, buildAdaptiveSession, planTopicIds } from "./dailyAdventureEngine";
import { createEmptyTopicProgress } from "./mastery";
import { createRng } from "../../utils/rng";
import type { MasteryEntry, TopicProgress } from "../../models/types";

const NOW = Date.now();
const ALL_TOPICS = ["colors", "shapes", "numbers", "animals", "food", "vehicles", "body", "emotions", "nature", "sounds"];

function strongProgressFor(topicIds: string[], vocabIdsByTopic: Record<string, string[]>): Record<string, TopicProgress> {
  const progress: Record<string, TopicProgress> = {};
  for (const topicId of topicIds) {
    let p = createEmptyTopicProgress(topicId);
    const masteryByVocab: Record<string, MasteryEntry> = {};
    for (const vocabId of vocabIdsByTopic[topicId] ?? []) {
      masteryByVocab[vocabId] = { score: 90, correctStreak: 5, totalAttempts: 8, totalCorrect: 8, lastSeenAt: NOW };
    }
    p = { ...p, masteryByVocab };
    progress[topicId] = p;
  }
  return progress;
}

describe("buildAdventurePlan", () => {
  it("a brand new profile (no progress at all) still gets a full plan with no crash", () => {
    const plan = buildAdventurePlan({
      enabledTopicIds: ALL_TOPICS,
      progress: {},
      durationMinutes: 10,
      rng: createRng(1),
    });
    expect(plan.length).toBeGreaterThan(0);
    for (const slot of plan) expect(ALL_TOPICS).toContain(slot.topicId);
  });

  it("opens with a familiar (known) skill when the child has strong skills available - success-first design", () => {
    const progress = strongProgressFor(["colors"], { colors: ["red", "blue", "yellow"] });
    const plan = buildAdventurePlan({
      enabledTopicIds: ALL_TOPICS,
      progress,
      durationMinutes: 10,
      rng: createRng(7),
    });
    expect(plan[0].purpose).toBe("familiar");
    expect(plan[0].topicId).toBe("colors");
  });

  it("is deterministic given the same seed", () => {
    const progress = strongProgressFor(["colors", "animals"], { colors: ["red", "blue"], animals: ["dog", "cat"] });
    const opts = { enabledTopicIds: ALL_TOPICS, progress, durationMinutes: 10, now: NOW };
    const planA = buildAdventurePlan({ ...opts, rng: createRng(42) });
    const planB = buildAdventurePlan({ ...opts, rng: createRng(42) });
    expect(planA).toEqual(planB);
  });

  it("never includes a disabled topic", () => {
    const progress = strongProgressFor(["colors", "animals"], { colors: ["red"], animals: ["dog"] });
    const plan = buildAdventurePlan({
      enabledTopicIds: ["colors"],
      progress,
      durationMinutes: 15,
      rng: createRng(3),
    });
    expect(plan.every((slot) => slot.topicId === "colors")).toBe(true);
  });

  it("gently steers away from a topic practiced in the immediately preceding sessions without ever excluding it", () => {
    // With everything else equal, a heavily recent-penalized topic should
    // appear less often across many plan generations than a neutral one -
    // not a hard guarantee for a single plan, so we sample many seeds.
    const progress = strongProgressFor(
      ["colors", "animals"],
      { colors: ["red", "blue", "yellow", "green"], animals: ["dog", "cat", "cow", "horse"] },
    );
    let colorsCount = 0;
    let animalsCount = 0;
    for (let seed = 0; seed < 40; seed++) {
      const plan = buildAdventurePlan({
        enabledTopicIds: ["colors", "animals"],
        progress,
        recentTopicIds: ["colors"],
        durationMinutes: 10,
        rng: createRng(seed),
      });
      for (const slot of plan) {
        if (slot.topicId === "colors") colorsCount++;
        if (slot.topicId === "animals") animalsCount++;
      }
    }
    expect(animalsCount).toBeGreaterThan(colorsCount);
  });

  it("falls back to a non-empty plan even when every topic is disabled", () => {
    const plan = buildAdventurePlan({ enabledTopicIds: [], progress: {}, durationMinutes: 5, rng: createRng(1) });
    expect(plan.length).toBeGreaterThan(0);
  });
});

describe("buildAdaptiveSession", () => {
  it("produces one generated activity per plan slot", () => {
    const progress = strongProgressFor(["colors"], { colors: ["red", "blue"] });
    const plan = buildAdventurePlan({ enabledTopicIds: ["colors"], progress, durationMinutes: 10, rng: createRng(5) });
    const session = buildAdaptiveSession(plan, progress, undefined, createRng(5));
    expect(session.activities.length).toBe(plan.length);
    expect(session.topicIds).toEqual(planTopicIds(plan));
  });

  it("a FIND slot with a pinned vocabId always generates an activity whose correct answer is that vocab", () => {
    const progress = strongProgressFor(["colors"], { colors: ["red"] });
    const plan = [{ topicId: "colors", vocabId: "red", purpose: "familiar" as const }];
    for (let seed = 0; seed < 10; seed++) {
      const session = buildAdaptiveSession(plan, progress, 1, createRng(seed));
      const activity = session.activities[0];
      if (activity.type === "FIND") expect(activity.correctIds).toContain("red");
    }
  });
});
