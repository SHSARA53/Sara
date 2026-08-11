import type { LearningSession, TopicProgress } from "../../models/types";
import { topics } from "../../data/topics/topics";

function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function sessionsForToday(sessions: LearningSession[], now: number = Date.now()): LearningSession[] {
  const today = dayKey(now);
  return sessions.filter((session) => dayKey(session.startedAt) === today);
}

export function minutesForSessions(sessions: LearningSession[]): number {
  const ms = sessions.reduce((sum, session) => sum + ((session.completedAt ?? session.startedAt) - session.startedAt), 0);
  return Math.round(ms / 60000);
}

export function topicsPracticed(sessions: LearningSession[]): string[] {
  return [...new Set(sessions.flatMap((session) => session.topicIds))];
}

export function accuracyForSessions(sessions: LearningSession[]): number {
  const results = sessions.flatMap((session) => session.results);
  if (results.length === 0) return 0;
  const correct = results.filter((result) => result.correct).length;
  return Math.round((correct / results.length) * 100);
}

export interface GroupedSessions {
  today: LearningSession[];
  yesterday: LearningSession[];
  earlierThisWeek: LearningSession[];
}

export function groupSessionsByRecency(sessions: LearningSession[], now: number = Date.now()): GroupedSessions {
  const today = dayKey(now);
  const yesterday = dayKey(now - 86400000);
  const weekAgo = now - 7 * 86400000;

  return {
    today: sessions.filter((s) => dayKey(s.startedAt) === today),
    yesterday: sessions.filter((s) => dayKey(s.startedAt) === yesterday),
    earlierThisWeek: sessions.filter((s) => s.startedAt >= weekAgo && dayKey(s.startedAt) !== today && dayKey(s.startedAt) !== yesterday),
  };
}

export interface TopicRecommendation {
  topicId: string;
  reason: "needs_practice" | "not_practiced" | "favorite";
}

export function recommendTopics(
  progress: Record<string, TopicProgress>,
  enabledTopicIds: string[],
  limit = 3,
): TopicRecommendation[] {
  const enabled = topics.filter((topic) => enabledTopicIds.includes(topic.id) && topic.id !== "games");
  const withProgress = enabled.map((topic) => ({ topic, entry: progress[topic.id] }));

  const notPracticed = withProgress.filter((item) => !item.entry).map((item) => ({ topicId: item.topic.id, reason: "not_practiced" as const }));
  const needsPractice = withProgress
    .filter((item) => item.entry && item.entry.overallMastery < 50)
    .sort((a, b) => (a.entry?.overallMastery ?? 0) - (b.entry?.overallMastery ?? 0))
    .map((item) => ({ topicId: item.topic.id, reason: "needs_practice" as const }));
  const favorites = withProgress
    .filter((item) => item.entry && item.entry.overallMastery >= 50)
    .sort((a, b) => (b.entry?.activitiesCompleted ?? 0) - (a.entry?.activitiesCompleted ?? 0))
    .map((item) => ({ topicId: item.topic.id, reason: "favorite" as const }));

  const combined = [...needsPractice, ...notPracticed, ...favorites];
  const seen = new Set<string>();
  const unique = combined.filter((rec) => (seen.has(rec.topicId) ? false : (seen.add(rec.topicId), true)));
  return unique.slice(0, limit);
}
