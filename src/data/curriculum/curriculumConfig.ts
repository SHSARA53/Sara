import type { CurriculumLevel, Domain } from "../../models/types";

/** Primary developmental domain per topic (see the Domain type for why motor/interaction isn't its own bucket here). */
export const TOPIC_DOMAIN: Record<string, Domain> = {
  colors: "colors",
  shapes: "shapes",
  numbers: "early_math",
  animals: "language",
  food: "language",
  vehicles: "language",
  body: "language",
  emotions: "social_emotional",
  opposites: "cognitive",
  nature: "nature",
  sounds: "cognitive",
};

/** Default curriculum level per topic - see topic-specific overrides (e.g. numbers) in skills.ts. */
export const TOPIC_CURRICULUM_LEVEL: Record<string, CurriculumLevel> = {
  colors: "explorer",
  animals: "explorer",
  body: "explorer",
  numbers: "explorer", // overridden per-vocab below for 4/5
  shapes: "little_discoverer",
  food: "little_discoverer",
  vehicles: "little_discoverer",
  emotions: "little_discoverer",
  opposites: "curious_explorer",
  nature: "curious_explorer",
  sounds: "curious_explorer",
};

/**
 * Ordered vocab-id sequences used to derive prerequisite chains (section 31
 * of the curriculum spec). Only topics with a clear, meaningful progression
 * get one; everything else has no prerequisites, which is a perfectly valid
 * curriculum choice, not an oversight.
 */
export const CURRICULUM_SEQUENCES: Record<string, string[]> = {
  colors: ["red", "blue", "yellow", "green", "pink", "orange", "purple"],
  numbers: ["n1", "n2", "n3", "n4", "n5"],
  shapes: ["circle", "square", "triangle", "rectangle"],
  animals: ["dog", "cat", "cow", "horse", "duck"],
};

/** Numbers 4-5 are meaningfully harder than 1-3 for this age band, so they belong in the next curriculum level even though the rest of "numbers" is Explorer content. */
export const VOCAB_CURRICULUM_LEVEL_OVERRIDE: Record<string, CurriculumLevel> = {
  n4: "little_discoverer",
  n5: "little_discoverer",
};
