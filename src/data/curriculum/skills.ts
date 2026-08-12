import type { Skill } from "../../models/types";
import { topics } from "../topics/topics";
import { TOPIC_DOMAIN, TOPIC_CURRICULUM_LEVEL, CURRICULUM_SEQUENCES, VOCAB_CURRICULUM_LEVEL_OVERRIDE } from "./curriculumConfig";

export function skillId(topicId: string, vocabId: string): string {
  return `${topicId}__${vocabId}`;
}

/**
 * The full skill catalog, generated from the existing topic/vocabulary data
 * rather than hand-duplicated - a skill is just a categorized, sequenced
 * pointer at one (topicId, vocabId) pair. Adding a new VocabItem to a topic
 * automatically gets a Skill for free; adding a topic to CURRICULUM_SEQUENCES
 * wires up prerequisite chains without touching this generator.
 */
function buildSkillCatalog(): Skill[] {
  const skills: Skill[] = [];

  for (const topic of topics) {
    const domain = TOPIC_DOMAIN[topic.id];
    if (!domain) continue; // topics with no domain mapping (e.g. the mixed "games" topic) don't carry their own skills
    const defaultLevel = TOPIC_CURRICULUM_LEVEL[topic.id] ?? "explorer";
    const sequence = CURRICULUM_SEQUENCES[topic.id];

    for (const item of topic.vocabulary) {
      const sequenceIndex = sequence?.indexOf(item.id) ?? -1;
      const prerequisites =
        sequenceIndex > 0 ? [skillId(topic.id, sequence![sequenceIndex - 1])] : [];

      skills.push({
        id: skillId(topic.id, item.id),
        topicId: topic.id,
        vocabId: item.id,
        domain,
        title: item.label,
        ageRange: topic.ageRange,
        prerequisites,
        curriculumLevel: VOCAB_CURRICULUM_LEVEL_OVERRIDE[item.id] ?? defaultLevel,
      });
    }
  }

  return skills;
}

export const skills: Skill[] = buildSkillCatalog();

export function getSkill(id: string): Skill | undefined {
  return skills.find((skill) => skill.id === id);
}

export function skillsForTopic(topicId: string): Skill[] {
  return skills.filter((skill) => skill.topicId === topicId);
}

export function skillsForDomain(domain: Skill["domain"]): Skill[] {
  return skills.filter((skill) => skill.domain === domain);
}

/** Sanity helper used by tests/tools - every prerequisite id should resolve to a real skill. */
export function allPrerequisitesResolve(): boolean {
  const ids = new Set(skills.map((skill) => skill.id));
  return skills.every((skill) => skill.prerequisites.every((prereqId) => ids.has(prereqId)));
}
