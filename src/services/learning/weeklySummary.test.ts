import { describe, expect, it } from "vitest";
import { buildWeeklySummary } from "./weeklySummary";
import type { LearningSession } from "../../models/types";

const NOW = new Date("2026-08-12T12:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

function session(topicIds: string[], startedAt: number): LearningSession {
  return {
    id: `s-${startedAt}-${topicIds.join(",")}`,
    topicIds,
    activities: [],
    currentIndex: 0,
    startedAt,
    completedAt: startedAt + 5 * 60000,
    results: [],
    rewardsEarned: { stars: 0, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [] },
  };
}

describe("buildWeeklySummary", () => {
  it("only counts sessions from the last 7 days", () => {
    const sessions = [session(["colors"], NOW - 1 * DAY), session(["animals"], NOW - 20 * DAY)];
    const summary = buildWeeklySummary(sessions, {}, ["colors", "animals"], NOW);
    expect(summary.topicIds).toEqual(["colors"]);
  });

  it("produces one highlight per top topic, using topic-flavored phrasing", () => {
    const sessions = [session(["colors"], NOW - 1 * DAY), session(["colors"], NOW - 2 * DAY), session(["colors"], NOW - 3 * DAY)];
    const summary = buildWeeklySummary(sessions, {}, ["colors"], NOW);
    expect(summary.highlights.length).toBeGreaterThan(0);
    expect(summary.highlights[0].en.toLowerCase()).toContain("recognition activities");
  });

  it("never uses grading language like percentages or pass/fail in highlight text", () => {
    const sessions = [session(["numbers"], NOW - 1 * DAY), session(["animals"], NOW - 2 * DAY)];
    const summary = buildWeeklySummary(sessions, {}, ["numbers", "animals"], NOW);
    for (const highlight of summary.highlights) {
      expect(highlight.en).not.toMatch(/%|grade|fail|behind/i);
      expect(highlight.he).not.toMatch(/%|כישלון|נכשל|מאחור/);
    }
  });

  it("suggested next never repeats a topic already highlighted this week", () => {
    const sessions = [session(["colors"], NOW - 1 * DAY)];
    const summary = buildWeeklySummary(sessions, {}, ["colors", "animals", "shapes", "numbers"], NOW);
    for (const topicId of summary.suggestedNextTopicIds) {
      expect(summary.topicIds).not.toContain(topicId);
    }
  });

  it("returns an empty-but-valid summary when nothing was played this week", () => {
    const summary = buildWeeklySummary([], {}, ["colors"], NOW);
    expect(summary.topicIds).toEqual([]);
    expect(summary.highlights).toEqual([]);
  });
});
