import type { LearningSession, LocalizedText, TopicProgress } from "../../models/types";
import { t } from "../../data/topics/helpers";
import { recommendTopics } from "./dashboardStats";
import { topicDisplayName } from "./recommendationService";

export interface WeeklySummary {
  topicIds: string[];
  highlights: LocalizedText[];
  suggestedNextTopicIds: string[];
}

/** Per-topic phrasing so highlights read like the spec's examples rather than a generic template stamped on every subject. */
const HIGHLIGHT_TEMPLATES: Record<string, (name: LocalizedText) => LocalizedText> = {
  colors: (name) =>
    t(`תרגלתם בהצלחה כמה פעילויות זיהוי ${name.he}`, `Successfully practiced several ${name.en} recognition activities`),
  numbers: () => t("תרגלתם ספירה של קבוצות קטנות של חפצים", "Practiced counting small groups of objects"),
  animals: (name) => t(`נהניתם הרבה מפעילויות ${name.he}`, `Frequently enjoyed ${name.en} activities`),
  shapes: (name) => t(`תרגלתם זיהוי והתאמה של ${name.he}`, `Practiced recognizing and matching ${name.en}`),
  emotions: () => t("תרגלתם לזהות רגשות שונים", "Practiced recognizing different feelings"),
};

function defaultHighlight(name: LocalizedText): LocalizedText {
  return t(`תרגלתם ${name.he} השבוע`, `Practiced ${name.en} this week`);
}

/**
 * A calm, non-technical weekly recap - never a report card. Highlights are
 * simple templated sentences (deterministic, no grading language), and
 * "suggested next" reuses the same transparent recommendation logic as the
 * dashboard's recommendations section.
 */
export function buildWeeklySummary(
  sessions: LearningSession[],
  progress: Record<string, TopicProgress>,
  enabledTopicIds: string[],
  now: number = Date.now(),
): WeeklySummary {
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = sessions.filter((session) => session.startedAt >= weekAgo);

  const counts = new Map<string, number>();
  for (const session of weekSessions) {
    for (const topicId of session.topicIds) counts.set(topicId, (counts.get(topicId) ?? 0) + 1);
  }

  const topicIds = [...counts.keys()];
  const topTopics = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([topicId]) => topicId);

  const highlights = topTopics.map((topicId) => {
    const name = topicDisplayName(topicId);
    const template = HIGHLIGHT_TEMPLATES[topicId] ?? defaultHighlight;
    return template(name);
  });

  const suggestedNextTopicIds = recommendTopics(progress, enabledTopicIds, 4)
    .map((rec) => rec.topicId)
    .filter((topicId) => !topTopics.includes(topicId))
    .slice(0, 3);

  return { topicIds, highlights, suggestedNextTopicIds };
}
