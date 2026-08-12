import type { LearningGoal, TopicProgress } from "../../models/types";

/** A goal is "explored together" once the topic has built up solid overall mastery - never a checklist to fail. */
export const GOAL_COMPLETE_THRESHOLD = 60;

export function goalMastery(goal: LearningGoal, progress: Record<string, TopicProgress>): number {
  return progress[goal.topicId]?.overallMastery ?? 0;
}

export function isGoalComplete(goal: LearningGoal, progress: Record<string, TopicProgress>): boolean {
  return goalMastery(goal, progress) >= GOAL_COMPLETE_THRESHOLD;
}
