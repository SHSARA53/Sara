import type { MasteryEntry, Skill, SkillState, TopicProgress } from "../../models/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getMasteryForSkill(
  progress: Record<string, TopicProgress>,
  skill: Skill,
): MasteryEntry | undefined {
  return progress[skill.topicId]?.masteryByVocab[skill.vocabId];
}

/**
 * How many days a skill can go unpracticed before it's due for a spaced
 * review - the stronger it is, the longer it can wait, which is the whole
 * point of spaced repetition (never quiz a fresh skill only once and call
 * it mastered, but also don't nag about something rock-solid every day).
 */
export function spacedReviewIntervalDays(score: number): number {
  if (score >= 86) return 14;
  if (score >= 61) return 7;
  if (score >= 31) return 3;
  return 1;
}

export function isDueForReview(entry: MasteryEntry, now: number): boolean {
  if (entry.totalAttempts === 0) return false;
  const daysSinceSeen = (now - entry.lastSeenAt) / DAY_MS;
  return daysSinceSeen >= spacedReviewIntervalDays(entry.score);
}

/**
 * Purely descriptive of app interaction - never a developmental claim. A
 * skill with a great score that just hasn't come up in a while is REVIEW,
 * not "forgotten": nothing here can regress a skill to NOT_INTRODUCED or
 * imply the child "lost" anything.
 */
export function deriveSkillState(entry: MasteryEntry | undefined, now: number = Date.now()): SkillState {
  if (!entry || entry.totalAttempts === 0) return "NOT_INTRODUCED";
  if (entry.totalAttempts <= 2) return "INTRODUCED";

  // A skill that's built up real mastery but has gone quiet for a while
  // should resurface for review before anything else - this check takes
  // priority over the plain score-based bucket below.
  if (entry.score >= 40 && isDueForReview(entry, now)) return "REVIEW";

  if (entry.score >= 75) return "STRONG";
  if (entry.score >= 40) return "EMERGING";
  return "PRACTICING";
}

export function skillStateForSkill(
  progress: Record<string, TopicProgress>,
  skill: Skill,
  now: number = Date.now(),
): SkillState {
  return deriveSkillState(getMasteryForSkill(progress, skill), now);
}
