import type { GeneratedActivity, LearningSession, TopicProgress } from "../../models/types";
import { getTopic } from "../../data/topics/topics";
import { availableActivityTypes, generateActivity } from "./activityGenerator";
import { createRng, pick } from "../../utils/rng";

const ACTIVITIES_PER_MINUTE = 0.8; // ~75 seconds per activity including feedback

export function activityCountForDuration(minutes: number): number {
  return Math.max(3, Math.round(minutes * ACTIVITIES_PER_MINUTE));
}

export interface BuildSessionOptions {
  topicIds: string[];
  durationMinutes: number;
  progressByTopic: Record<string, TopicProgress>;
  seed?: number;
  /** Overrides the adaptive per-topic difficulty, e.g. when a parent picks a fixed difficulty in the Learning Plan builder. */
  difficultyOverride?: 1 | 2 | 3;
}

export function buildSession(options: BuildSessionOptions): LearningSession {
  const { topicIds, durationMinutes, progressByTopic, seed, difficultyOverride } = options;
  const rng = seed ? createRng(seed) : Math.random;
  const count = activityCountForDuration(durationMinutes);
  const validTopicIds = topicIds.filter((id) => getTopic(id));
  const rotation = validTopicIds.length > 0 ? validTopicIds : ["colors"];

  const activities: GeneratedActivity[] = [];
  for (let i = 0; i < count; i++) {
    const topicId = rotation[i % rotation.length];
    const topic = getTopic(topicId);
    if (!topic) continue;
    const types = availableActivityTypes(topic);
    if (types.length === 0) continue;
    const type = pick(types, rng);
    const progress = progressByTopic[topicId];
    const difficulty = difficultyOverride ?? progress?.difficultyLevel ?? 1;
    activities.push(
      generateActivity(topic, type, difficulty, {
        rng,
        masteryByVocab: progress?.masteryByVocab,
      }),
    );
  }

  return {
    id: `session-${Date.now()}`,
    topicIds: rotation,
    activities,
    currentIndex: 0,
    startedAt: Date.now(),
    results: [],
    rewardsEarned: { stars: 0, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [] },
  };
}
