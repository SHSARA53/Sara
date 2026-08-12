import type { GeneratedActivity, LearningSession, Skill, TopicProgress } from "../../models/types";
import { skills } from "../../data/curriculum/skills";
import { getTopic } from "../../data/topics/topics";
import { generateActivity } from "./activityGenerator";
import { skillStateForSkill } from "./skillState";
import { prerequisitesMet } from "./curriculumLevel";
import { activityCountForDuration } from "./sessionGenerator";
import { shuffle, weightedSample } from "../../utils/rng";

export type AdventurePurpose = "familiar" | "emerging" | "new" | "mixed";

export interface AdventurePlanSlot {
  topicId: string;
  /** Which specific skill this slot targets, when the activity type supports pinning one (FIND). COUNT/MATCH/MEMORY/SORT activities cover several vocab items at once, so this is left unset for those. */
  vocabId?: string;
  purpose: AdventurePurpose;
}

export interface AdventurePlanOptions {
  enabledTopicIds: string[];
  progress: Record<string, TopicProgress>;
  /** Most-recently-practiced topics first - used to gently steer away from "the same topic four sessions running" without ever excluding it outright. */
  recentTopicIds?: string[];
  durationMinutes: number;
  now?: number;
  rng?: () => number;
}

const RECENT_TOPIC_PENALTY = 0.35;

function topicWeight(topicId: string, recentTopicIds: string[]): number {
  const recentIndex = recentTopicIds.indexOf(topicId);
  if (recentIndex === -1) return 1;
  // The most recently played topic is penalized the most; the penalty fades a couple of sessions back.
  return recentIndex === 0 ? RECENT_TOPIC_PENALTY : recentIndex === 1 ? 0.65 : 0.85;
}

/**
 * Classifies every skill in the enabled topics into familiar/emerging/new
 * pools. "New" only includes skills whose prerequisites are already
 * comfortable, so the curriculum sequence (e.g. colors red->blue->...) is
 * respected without needing an explicit unlock system.
 */
function classifySkills(
  enabledTopicIds: string[],
  progress: Record<string, TopicProgress>,
  now: number,
): { familiar: Skill[]; emerging: Skill[]; fresh: Skill[] } {
  const familiar: Skill[] = [];
  const emerging: Skill[] = [];
  const fresh: Skill[] = [];

  for (const skill of skills) {
    if (!enabledTopicIds.includes(skill.topicId)) continue;
    const state = skillStateForSkill(progress, skill, now);
    if (state === "STRONG" || state === "REVIEW") familiar.push(skill);
    else if (state === "EMERGING" || state === "PRACTICING" || state === "INTRODUCED") emerging.push(skill);
    else if (state === "NOT_INTRODUCED" && prerequisitesMet(skill, skills, progress, now)) fresh.push(skill);
  }

  return { familiar, emerging, fresh };
}

function drawSkills(pool: Skill[], count: number, recentTopicIds: string[], rng: () => number): Skill[] {
  if (count <= 0 || pool.length === 0) return [];
  return weightedSample(pool, count, (skill) => topicWeight(skill.topicId, recentTopicIds), rng);
}

/**
 * Turns the 50/30/20 target ratio into concrete per-pool counts, capped by
 * how many skills are actually available in each pool and cascading any
 * shortfall to the next pool (familiar -> fresh -> emerging) so a session
 * still fills up even for a brand-new profile with nothing familiar yet.
 */
function allocateSlots(
  slotCount: number,
  poolSizes: { familiar: number; emerging: number; fresh: number },
): { familiar: number; emerging: number; fresh: number } {
  const wantFamiliar = Math.round(slotCount * 0.5);
  const wantEmerging = Math.round(slotCount * 0.3);

  const take = { familiar: 0, emerging: 0, fresh: 0 };
  take.familiar = Math.min(wantFamiliar, poolSizes.familiar);
  let remaining = slotCount - take.familiar;

  take.emerging = Math.min(wantEmerging, poolSizes.emerging, remaining);
  remaining -= take.emerging;

  take.fresh = Math.min(remaining, poolSizes.fresh);
  remaining -= take.fresh;

  // Pools ran out before the slot count did - top back up with whatever
  // capacity is left, familiar first (reinforcement beats padding with
  // more new material), then emerging.
  if (remaining > 0) {
    const extra = Math.min(remaining, poolSizes.familiar - take.familiar);
    take.familiar += extra;
    remaining -= extra;
  }
  if (remaining > 0) {
    const extra = Math.min(remaining, poolSizes.emerging - take.emerging);
    take.emerging += extra;
    remaining -= extra;
  }

  return take;
}

/**
 * Builds a balanced set of slots for today's adventure: roughly half
 * familiar/reinforcement, a third emerging skills, a fifth brand-new
 * content - falling back gracefully (e.g. an all-new profile has no
 * familiar/emerging skills yet, so everything degrades to "new" without
 * crashing or leaving slots empty). The very first slot is always familiar
 * when one is available, so the child starts from a confident, known win
 * before the adventure introduces anything harder.
 */
export function buildAdventurePlan(opts: AdventurePlanOptions): AdventurePlanSlot[] {
  const now = opts.now ?? Date.now();
  const rng = opts.rng ?? Math.random;
  const recentTopicIds = opts.recentTopicIds ?? [];
  const slotCount = activityCountForDuration(opts.durationMinutes);

  const { familiar, emerging, fresh } = classifySkills(opts.enabledTopicIds, opts.progress, now);

  const allocation = allocateSlots(slotCount, {
    familiar: familiar.length,
    emerging: emerging.length,
    fresh: fresh.length,
  });

  const chosenFamiliar = drawSkills(familiar, allocation.familiar, recentTopicIds, rng);
  const chosenEmerging = drawSkills(emerging, allocation.emerging, recentTopicIds, rng);
  const chosenFresh = drawSkills(fresh, allocation.fresh, recentTopicIds, rng);

  // Last stretch of the adventure is a lighter "mixed practice" pass over
  // familiar ground (spec's "mixed practice" / "review" tail) rather than
  // more brand-new content, so the session winds down instead of ramping up.
  const mixedCount = Math.min(2, Math.max(1, Math.round(slotCount * 0.15)));
  const reinforcementPool = familiar.length > 0 ? familiar : [...emerging, ...fresh];
  const chosenMixed = drawSkills(
    reinforcementPool.filter((s) => !chosenFamiliar.includes(s)),
    Math.min(mixedCount, Math.max(0, slotCount - chosenFamiliar.length - chosenEmerging.length - chosenFresh.length)),
    recentTopicIds,
    rng,
  );

  const opener = chosenFamiliar[0];
  const restFamiliar = chosenFamiliar.slice(1);

  const middle = shuffle(
    [
      ...restFamiliar.map((s) => ({ skill: s, purpose: "familiar" as const })),
      ...chosenEmerging.map((s) => ({ skill: s, purpose: "emerging" as const })),
      ...chosenFresh.map((s) => ({ skill: s, purpose: "new" as const })),
    ],
    rng,
  );

  const slots: AdventurePlanSlot[] = [];
  if (opener) slots.push({ topicId: opener.topicId, vocabId: opener.vocabId, purpose: "familiar" });
  for (const entry of middle) slots.push({ topicId: entry.skill.topicId, vocabId: entry.skill.vocabId, purpose: entry.purpose });
  for (const skill of chosenMixed) slots.push({ topicId: skill.topicId, vocabId: skill.vocabId, purpose: "mixed" });

  if (slots.length === 0) {
    // No enabled topic produced anything selectable (e.g. every topic is
    // disabled) - fall back to a safe default rather than an empty session.
    const fallbackTopicId = opts.enabledTopicIds[0] ?? "colors";
    for (let i = 0; i < slotCount; i++) slots.push({ topicId: fallbackTopicId, purpose: "new" });
  }

  return slots.slice(0, slotCount);
}

/** Distinct topics touched by a plan, in the order they first appear - used to preview "today's adventure" without generating the full activity list. */
export function planTopicIds(plan: AdventurePlanSlot[]): string[] {
  const seen: string[] = [];
  for (const slot of plan) if (!seen.includes(slot.topicId)) seen.push(slot.topicId);
  return seen;
}

function activityTypeForSlot(topicId: string, purpose: AdventurePurpose, rng: () => number): GeneratedActivity["type"] {
  const topic = getTopic(topicId)!;
  if (purpose === "mixed") {
    const playful = topic.activityTypes.filter((t) => t === "MATCH" || t === "MEMORY" || t === "SORT");
    if (playful.length > 0) return playful[Math.floor(rng() * playful.length)];
  }
  if (topicId === "numbers" && topic.activityTypes.includes("COUNT") && rng() < 0.5) return "COUNT";
  return "FIND";
}

/** Turns a plan into a real, playable session - every activity still comes from the same generateActivity() the rest of the app uses. */
export function buildAdaptiveSession(
  plan: AdventurePlanSlot[],
  progressByTopic: Record<string, TopicProgress>,
  difficultyOverride?: 1 | 2 | 3,
  rng: () => number = Math.random,
): LearningSession {
  const activities: GeneratedActivity[] = [];
  // Other topics already in today's plan make a natural, contextual pool to
  // count from ("how many ducks?" while Animal Forest is also part of the
  // adventure) instead of numbers always counting its own emoji.
  const otherPlanTopics = planTopicIds(plan).filter((id) => id !== "numbers");

  for (const slot of plan) {
    const topic = getTopic(slot.topicId);
    if (!topic) continue;
    const type = activityTypeForSlot(slot.topicId, slot.purpose, rng);
    const progress = progressByTopic[slot.topicId];
    const difficulty = difficultyOverride ?? progress?.difficultyLevel ?? 1;
    const countContextTopicId =
      type === "COUNT" && slot.topicId === "numbers" && otherPlanTopics.length > 0
        ? otherPlanTopics[Math.floor(rng() * otherPlanTopics.length)]
        : undefined;
    activities.push(
      generateActivity(topic, type, difficulty, {
        rng,
        masteryByVocab: progress?.masteryByVocab,
        forcedVocabId: type === "FIND" ? slot.vocabId : undefined,
        countContextTopicId,
      }),
    );
  }

  return {
    id: `session-${Date.now()}`,
    topicIds: planTopicIds(plan),
    activities,
    currentIndex: 0,
    startedAt: Date.now(),
    results: [],
    rewardsEarned: { stars: 0, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [] },
  };
}
