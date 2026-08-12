import { describe, expect, it } from "vitest";
import { currentCurriculumLevel, isComfortable, prerequisitesMet } from "./curriculumLevel";
import { skills, skillId } from "../../data/curriculum/skills";
import { createEmptyTopicProgress } from "./mastery";
import type { MasteryEntry, TopicProgress } from "../../models/types";

const NOW = Date.now();

/** Merges a single vocab item's mastery into an existing progress map, unlike a fresh createEmptyTopicProgress() call which would clobber any other vocab already recorded for that topic. */
function addMastery(
  progress: Record<string, TopicProgress>,
  topicId: string,
  vocabId: string,
  score: number,
): Record<string, TopicProgress> {
  const existing = progress[topicId] ?? createEmptyTopicProgress(topicId);
  const entry: MasteryEntry = { score, correctStreak: 0, totalAttempts: 5, totalCorrect: 5, lastSeenAt: NOW };
  return { ...progress, [topicId]: { ...existing, masteryByVocab: { ...existing.masteryByVocab, [vocabId]: entry } } };
}

describe("isComfortable", () => {
  it("treats EMERGING/STRONG/REVIEW as comfortable, everything else as not", () => {
    expect(isComfortable("EMERGING")).toBe(true);
    expect(isComfortable("STRONG")).toBe(true);
    expect(isComfortable("REVIEW")).toBe(true);
    expect(isComfortable("NOT_INTRODUCED")).toBe(false);
    expect(isComfortable("INTRODUCED")).toBe(false);
    expect(isComfortable("PRACTICING")).toBe(false);
  });
});

describe("prerequisitesMet", () => {
  const blueSkill = skills.find((s) => s.id === skillId("colors", "blue"))!;
  const redSkill = skills.find((s) => s.id === skillId("colors", "red"))!;

  it("a skill with no prerequisites is always ready", () => {
    expect(redSkill.prerequisites).toEqual([]);
    expect(prerequisitesMet(redSkill, skills, {}, NOW)).toBe(true);
  });

  it("blue requires red to be comfortable first (colors sequence)", () => {
    expect(blueSkill.prerequisites).toEqual([skillId("colors", "red")]);
    expect(prerequisitesMet(blueSkill, skills, {}, NOW)).toBe(false);

    const progress = addMastery({}, "colors", "red", 50); // EMERGING - comfortable
    expect(prerequisitesMet(blueSkill, skills, progress, NOW)).toBe(true);
  });

  it("is not fooled by a low-score prerequisite (PRACTICING isn't comfortable)", () => {
    const progress = addMastery({}, "colors", "red", 10);
    expect(prerequisitesMet(blueSkill, skills, progress, NOW)).toBe(false);
  });
});

describe("currentCurriculumLevel", () => {
  it("starts at explorer for a brand new profile", () => {
    expect(currentCurriculumLevel(skills, {}, NOW)).toBe("explorer");
  });

  it("promotes to little_discoverer once several explorer skills are comfortably progressing", () => {
    let progress: Record<string, TopicProgress> = {};
    const explorerSkills = skills.filter((s) => s.curriculumLevel === "explorer").slice(0, 3);
    for (const skill of explorerSkills) {
      progress = addMastery(progress, skill.topicId, skill.vocabId, 70);
    }
    expect(currentCurriculumLevel(skills, progress, NOW)).toBe("little_discoverer");
  });

  it("never skips a level even with deep progress in a single narrow (explorer-only) area", () => {
    let progress: Record<string, TopicProgress> = {};
    for (const vocabId of ["red", "blue", "yellow", "green", "pink", "orange", "purple"]) {
      progress = addMastery(progress, "colors", vocabId, 95);
    }
    expect(currentCurriculumLevel(skills, progress, NOW)).toBe("little_discoverer");
    expect(currentCurriculumLevel(skills, progress, NOW)).not.toBe("curious_explorer");
  });
});
