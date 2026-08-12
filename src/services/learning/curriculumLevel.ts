import type { Skill, SkillState, TopicProgress, CurriculumLevel } from "../../models/types";
import { skillStateForSkill } from "./skillState";

/** States comfortable enough that a dependent skill can be introduced. */
const COMFORTABLE_STATES: SkillState[] = ["EMERGING", "STRONG", "REVIEW"];

export function isComfortable(state: SkillState): boolean {
  return COMFORTABLE_STATES.includes(state);
}

export function prerequisitesMet(
  skill: Skill,
  allSkills: Skill[],
  progress: Record<string, TopicProgress>,
  now: number = Date.now(),
): boolean {
  if (skill.prerequisites.length === 0) return true;
  return skill.prerequisites.every((prereqId) => {
    const prereqSkill = allSkills.find((s) => s.id === prereqId);
    if (!prereqSkill) return true; // unknown prerequisite shouldn't block content
    return isComfortable(skillStateForSkill(progress, prereqSkill, now));
  });
}

const LEVEL_ORDER: CurriculumLevel[] = ["explorer", "little_discoverer", "curious_explorer"];
const PROMOTION_THRESHOLD = 3; // skills with solid mastery before the next level "unlocks" (for framing only, never gates content)

/**
 * A simple, transparent classification for the parent dashboard - never
 * shown to the child as a grade. Escalates once the child has real,
 * sustained engagement (several skills at score >= 61) at a level, and
 * never skips a level even with fast progress in one narrow area.
 */
export function currentCurriculumLevel(
  allSkills: Skill[],
  progress: Record<string, TopicProgress>,
  now: number = Date.now(),
): CurriculumLevel {
  const solidCountAtLevel = (level: CurriculumLevel): number =>
    allSkills.filter((skill) => skill.curriculumLevel === level).filter((skill) => {
      const state = skillStateForSkill(progress, skill, now);
      return state === "STRONG" || state === "EMERGING" || state === "REVIEW";
    }).length;

  let current: CurriculumLevel = "explorer";
  for (const level of LEVEL_ORDER) {
    if (level === "explorer") continue;
    const previousIndex = LEVEL_ORDER.indexOf(level) - 1;
    const previousLevel = LEVEL_ORDER[previousIndex];
    if (solidCountAtLevel(previousLevel) >= PROMOTION_THRESHOLD) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}
