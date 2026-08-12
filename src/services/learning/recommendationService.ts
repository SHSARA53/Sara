import type { LearningSession, LocalizedText, TopicProgress } from "../../models/types";
import { getTopic, topics } from "../../data/topics/topics";
import { getWorldByTopicId } from "../../data/worlds/worlds";
import { skills } from "../../data/curriculum/skills";
import { skillStateForSkill } from "./skillState";
import { recommendTopics, type TopicRecommendation } from "./dashboardStats";
import { t } from "../../data/topics/helpers";

export interface LearningRecommendation {
  topicId: string;
  /** Parent-facing "why" - transparency per the curriculum spec (never a black box). */
  reason: LocalizedText;
  kind: TopicRecommendation["reason"];
}

export interface RecommendationInput {
  progress: Record<string, TopicProgress>;
  sessions: LearningSession[];
  enabledTopicIds: string[];
  now?: number;
  limit?: number;
}

export function topicDisplayName(topicId: string): LocalizedText {
  return getWorldByTopicId(topicId)?.title ?? getTopic(topicId)?.title ?? t(topicId, topicId);
}

function reasonFor(rec: TopicRecommendation): LocalizedText {
  const name = topicDisplayName(rec.topicId);
  switch (rec.reason) {
    case "not_practiced":
      return t(`עדיין לא התנסיתם ב${name.he}`, `You haven't tried ${name.en} yet`);
    case "needs_practice":
      return t(`${name.he} לא תורגל לאחרונה`, `${name.en} hasn't been practiced recently`);
    case "favorite":
      return t(`הילד/ה נהנה/ית מ${name.he} לאחרונה`, `Your child has been enjoying ${name.en}`);
  }
}

/**
 * A clean, swappable seam: today this is a transparent local rule-based
 * algorithm (reuses the same progress/mastery data the rest of the app
 * already computes), but any future smarter recommender - even one backed
 * by a remote model - can implement the same interface without touching a
 * single call site. No child performance data leaves the device today.
 */
export interface LearningRecommendationService {
  getRecommendations(input: RecommendationInput): LearningRecommendation[];
}

export const localRuleBasedRecommendationService: LearningRecommendationService = {
  getRecommendations(input) {
    const base = recommendTopics(input.progress, input.enabledTopicIds, input.limit ?? 3);
    return base.map((rec) => ({ topicId: rec.topicId, kind: rec.reason, reason: reasonFor(rec) }));
  },
};

/** Skills due for spaced review, summarized at the topic level for a calm, non-technical parent view ("Let's revisit Colors") instead of a per-skill queue. */
export function topicsGoodToReview(
  progress: Record<string, TopicProgress>,
  enabledTopicIds: string[],
  now: number = Date.now(),
  limit = 3,
): string[] {
  const dueCountByTopic = new Map<string, number>();
  for (const skill of skills) {
    if (!enabledTopicIds.includes(skill.topicId)) continue;
    const state = skillStateForSkill(progress, skill, now);
    if (state === "REVIEW") dueCountByTopic.set(skill.topicId, (dueCountByTopic.get(skill.topicId) ?? 0) + 1);
  }
  return [...dueCountByTopic.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topicId]) => topicId);
}

/** Skills that moved into EMERGING recently-ish (i.e. currently emerging at all) - the "growing" story parents want to see, not a raw percentage. */
export function growingSkillTopics(
  progress: Record<string, TopicProgress>,
  enabledTopicIds: string[],
  now: number = Date.now(),
  limit = 4,
): { topicId: string; skillTitle: LocalizedText }[] {
  const entries: { topicId: string; skillTitle: LocalizedText; score: number }[] = [];
  for (const skill of skills) {
    if (!enabledTopicIds.includes(skill.topicId)) continue;
    const state = skillStateForSkill(progress, skill, now);
    if (state === "EMERGING") {
      const score = progress[skill.topicId]?.masteryByVocab[skill.vocabId]?.score ?? 0;
      entries.push({ topicId: skill.topicId, skillTitle: skill.title, score });
    }
  }
  return entries
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ topicId, skillTitle }) => ({ topicId, skillTitle }));
}

export function recentlyPracticedTopics(sessions: LearningSession[], days = 7, now: number = Date.now()): string[] {
  const cutoff = now - days * 86400000;
  const recent = sessions.filter((session) => session.startedAt >= cutoff);
  const seen: string[] = [];
  for (const session of recent) {
    for (const topicId of session.topicIds) {
      if (!seen.includes(topicId) && getTopic(topicId)) seen.push(topicId);
    }
  }
  return seen;
}

export function favoriteWorldTopics(sessions: LearningSession[], limit = 2): string[] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    for (const topicId of session.topicIds) counts.set(topicId, (counts.get(topicId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([topicId]) => topics.some((topic) => topic.id === topicId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topicId]) => topicId);
}
