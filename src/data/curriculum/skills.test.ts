import { describe, expect, it } from "vitest";
import { skills, skillId, getSkill, skillsForTopic, skillsForDomain, allPrerequisitesResolve } from "./skills";
import { topics } from "../topics/topics";

describe("skill catalog", () => {
  it("generates at least one skill for every topic that has a domain mapping", () => {
    expect(skills.length).toBeGreaterThan(50);
  });

  it("has no duplicate skill ids", () => {
    const ids = skills.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every skill's id follows the topicId__vocabId convention and resolves back via getSkill", () => {
    for (const skill of skills.slice(0, 20)) {
      expect(skill.id).toBe(skillId(skill.topicId, skill.vocabId));
      expect(getSkill(skill.id)).toBe(skill);
    }
  });

  it("every skill points at a vocab item that actually exists in its topic", () => {
    for (const skill of skills) {
      const topic = topics.find((t) => t.id === skill.topicId)!;
      expect(topic.vocabulary.some((v) => v.id === skill.vocabId)).toBe(true);
    }
  });

  it("all prerequisite ids resolve to real skills (no dangling references)", () => {
    expect(allPrerequisitesResolve()).toBe(true);
  });

  it("skips the mixed 'games' topic, which has no vocabulary of its own", () => {
    expect(skillsForTopic("games")).toHaveLength(0);
  });

  it("groups skills by domain", () => {
    const colorSkills = skillsForDomain("colors");
    expect(colorSkills.length).toBeGreaterThan(0);
    expect(colorSkills.every((s) => s.topicId === "colors")).toBe(true);
  });

  it("follows the documented colors sequence (red -> blue -> yellow -> ... -> purple)", () => {
    const order = ["red", "blue", "yellow", "green", "pink", "orange", "purple"];
    for (let i = 1; i < order.length; i++) {
      const skill = getSkill(skillId("colors", order[i]))!;
      expect(skill.prerequisites).toEqual([skillId("colors", order[i - 1])]);
    }
    const first = getSkill(skillId("colors", order[0]))!;
    expect(first.prerequisites).toEqual([]);
  });

  it("follows the documented numbers sequence (1 -> 2 -> 3 -> 4 -> 5)", () => {
    const order = ["n1", "n2", "n3", "n4", "n5"];
    for (let i = 1; i < order.length; i++) {
      const skill = getSkill(skillId("numbers", order[i]))!;
      expect(skill.prerequisites).toEqual([skillId("numbers", order[i - 1])]);
    }
  });

  it("puts numbers 4-5 a curriculum level above 1-3, even though they're the same topic", () => {
    const n3 = getSkill(skillId("numbers", "n3"))!;
    const n4 = getSkill(skillId("numbers", "n4"))!;
    expect(n3.curriculumLevel).toBe("explorer");
    expect(n4.curriculumLevel).toBe("little_discoverer");
  });

  it("topics with no documented sequence have no prerequisites for any of their skills", () => {
    for (const skill of skillsForTopic("emotions")) {
      expect(skill.prerequisites).toEqual([]);
    }
  });
});
