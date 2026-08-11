import { describe, expect, it } from "vitest";
import { adjustDifficulty, computeOverallMastery, createEmptyTopicProgress, masteryLabel, updateMastery } from "./mastery";
import type { TopicProgress } from "../../models/types";

describe("masteryLabel", () => {
  it("buckets scores per the 0-30/31-60/61-85/86-100 spec", () => {
    expect(masteryLabel(0)).toBe("needs_practice");
    expect(masteryLabel(30)).toBe("needs_practice");
    expect(masteryLabel(31)).toBe("learning");
    expect(masteryLabel(60)).toBe("learning");
    expect(masteryLabel(61)).toBe("progressing");
    expect(masteryLabel(85)).toBe("progressing");
    expect(masteryLabel(86)).toBe("strong");
    expect(masteryLabel(100)).toBe("strong");
  });
});

describe("updateMastery", () => {
  it("starts a fresh vocab item at 0 and grows it on a correct answer", () => {
    const entry = updateMastery(undefined, true, 1000);
    expect(entry.score).toBeGreaterThan(0);
    expect(entry.correctStreak).toBe(1);
    expect(entry.totalAttempts).toBe(1);
    expect(entry.totalCorrect).toBe(1);
  });

  it("never marks something mastered after a single correct answer", () => {
    const entry = updateMastery(undefined, true, 1000);
    expect(entry.score).toBeLessThan(86);
  });

  it("rewards consecutive correct answers with an increasing streak bonus", () => {
    let entry = updateMastery(undefined, true, 1000);
    const firstGain = entry.score;
    entry = updateMastery(entry, true, 2000);
    const secondGain = entry.score - firstGain;
    expect(secondGain).toBeGreaterThan(0);
    entry = updateMastery(entry, true, 3000);
    const thirdGain = entry.score - (firstGain + secondGain);
    expect(thirdGain).toBeGreaterThanOrEqual(secondGain);
  });

  it("lowers the score and resets the streak on a wrong answer, but never below 0", () => {
    const afterWrong = updateMastery({ score: 5, correctStreak: 3, totalAttempts: 3, totalCorrect: 3, lastSeenAt: 0 }, false, 500);
    expect(afterWrong.score).toBe(0);
    expect(afterWrong.correctStreak).toBe(0);
    expect(afterWrong.totalAttempts).toBe(4);
    expect(afterWrong.totalCorrect).toBe(3);
  });

  it("never exceeds 100", () => {
    let entry = { score: 95, correctStreak: 5, totalAttempts: 10, totalCorrect: 10, lastSeenAt: 0 };
    entry = updateMastery(entry, true, 1);
    expect(entry.score).toBeLessThanOrEqual(100);
  });
});

describe("computeOverallMastery", () => {
  it("returns 0 when nothing has been attempted", () => {
    expect(computeOverallMastery({})).toBe(0);
  });

  it("averages only vocab items that have been attempted", () => {
    const mastery = computeOverallMastery({
      red: { score: 80, correctStreak: 1, totalAttempts: 2, totalCorrect: 1, lastSeenAt: 0 },
      blue: { score: 40, correctStreak: 0, totalAttempts: 1, totalCorrect: 0, lastSeenAt: 0 },
      green: { score: 0, correctStreak: 0, totalAttempts: 0, totalCorrect: 0, lastSeenAt: 0 }, // never attempted
    });
    expect(mastery).toBe(60); // (80 + 40) / 2, "green" excluded
  });
});

describe("adjustDifficulty", () => {
  it("bumps the level up only after 3 consecutive correct answers, one level at a time", () => {
    let progress = createEmptyTopicProgress("colors");
    expect(progress.difficultyLevel).toBe(1);

    progress = adjustDifficulty(progress, true);
    progress = adjustDifficulty(progress, true);
    expect(progress.difficultyLevel).toBe(1); // not yet, only 2 in a row

    progress = adjustDifficulty(progress, true);
    expect(progress.difficultyLevel).toBe(2); // 3rd consecutive correct answer
  });

  it("never jumps more than one level even with a long correct streak", () => {
    let progress = createEmptyTopicProgress("colors");
    for (let i = 0; i < 9; i++) progress = adjustDifficulty(progress, true);
    expect(progress.difficultyLevel).toBe(3);
  });

  it("eases the level down after 2 consecutive misses, and stops at level 1", () => {
    let progress: TopicProgress = { ...createEmptyTopicProgress("colors"), difficultyLevel: 2 };
    progress = adjustDifficulty(progress, false);
    expect(progress.difficultyLevel).toBe(2); // one miss is not enough
    progress = adjustDifficulty(progress, false);
    expect(progress.difficultyLevel).toBe(1);
    progress = adjustDifficulty(progress, false);
    progress = adjustDifficulty(progress, false);
    expect(progress.difficultyLevel).toBe(1); // floor
  });

  it("a correct answer resets the incorrect streak", () => {
    let progress = createEmptyTopicProgress("colors");
    progress = adjustDifficulty(progress, false);
    progress = adjustDifficulty(progress, true);
    expect(progress.recentIncorrectStreak).toBe(0);
  });
});
