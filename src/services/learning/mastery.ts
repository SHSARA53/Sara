import type { MasteryEntry, TopicProgress } from "../../models/types";

export type MasteryLabel = "needs_practice" | "learning" | "progressing" | "strong";

export function masteryLabel(score: number): MasteryLabel {
  if (score <= 30) return "needs_practice";
  if (score <= 60) return "learning";
  if (score <= 85) return "progressing";
  return "strong";
}

const CORRECT_GAIN = 14;
const STREAK_BONUS = 3;
const INCORRECT_LOSS = 9;

export function updateMastery(
  entry: MasteryEntry | undefined,
  correct: boolean,
  now: number = Date.now(),
): MasteryEntry {
  const prev: MasteryEntry = entry ?? {
    score: 0,
    correctStreak: 0,
    totalAttempts: 0,
    totalCorrect: 0,
    lastSeenAt: now,
  };

  if (correct) {
    const gain = CORRECT_GAIN + Math.min(prev.correctStreak, 4) * STREAK_BONUS;
    return {
      score: Math.min(100, prev.score + gain),
      correctStreak: prev.correctStreak + 1,
      totalAttempts: prev.totalAttempts + 1,
      totalCorrect: prev.totalCorrect + 1,
      lastSeenAt: now,
    };
  }

  return {
    score: Math.max(0, prev.score - INCORRECT_LOSS),
    correctStreak: 0,
    totalAttempts: prev.totalAttempts + 1,
    totalCorrect: prev.totalCorrect,
    lastSeenAt: now,
  };
}

export function computeOverallMastery(masteryByVocab: Record<string, MasteryEntry>): number {
  const entries = Object.values(masteryByVocab).filter((entry) => entry.totalAttempts > 0);
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, entry) => sum + entry.score, 0);
  return Math.round(total / entries.length);
}

export function createEmptyTopicProgress(topicId: string): TopicProgress {
  return {
    topicId,
    masteryByVocab: {},
    overallMastery: 0,
    activitiesCompleted: 0,
    difficultyLevel: 1,
    recentCorrectStreak: 0,
    recentIncorrectStreak: 0,
  };
}

/**
 * Gradual adaptive difficulty: bump the level up after 3 consecutive correct
 * answers, ease it down after 2 consecutive misses. Never jumps more than one
 * level at a time, per the "never suddenly increase difficulty" requirement.
 */
export function adjustDifficulty(progress: TopicProgress, correct: boolean): TopicProgress {
  const next: TopicProgress = { ...progress };

  if (correct) {
    next.recentCorrectStreak = progress.recentCorrectStreak + 1;
    next.recentIncorrectStreak = 0;
    if (next.recentCorrectStreak >= 3 && progress.difficultyLevel < 3) {
      next.difficultyLevel = (progress.difficultyLevel + 1) as 1 | 2 | 3;
      next.recentCorrectStreak = 0;
    }
  } else {
    next.recentIncorrectStreak = progress.recentIncorrectStreak + 1;
    next.recentCorrectStreak = 0;
    if (next.recentIncorrectStreak >= 2 && progress.difficultyLevel > 1) {
      next.difficultyLevel = (progress.difficultyLevel - 1) as 1 | 2 | 3;
      next.recentIncorrectStreak = 0;
    }
  }

  return next;
}

/** Weight for spaced-repetition style vocab selection: lower mastery -> higher weight. */
export function repetitionWeight(masteryByVocab: Record<string, MasteryEntry>, vocabId: string): number {
  const score = masteryByVocab[vocabId]?.score ?? 0;
  return 100 - score + 10;
}
