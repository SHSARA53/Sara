// Core data model for the app. Every piece of educational content is data,
// never hardcoded into a screen component, so new topics/activities can be
// added without touching the engine or the UI.

export type Lang = "he" | "en";

export type LocalizedText = Record<Lang, string>;

export type ThemeKey =
  | "bubblegum"
  | "sky"
  | "sun"
  | "mint"
  | "lilac"
  | "peach"
  | "berry";

/** A single learnable concept inside a topic (e.g. the color red, a cow, the number 3). */
export interface VocabItem {
  id: string;
  label: LocalizedText;
  /** Emoji used as the illustration - scales perfectly, needs no image assets, works fully offline. */
  emoji: string;
  /** Hex color, used by color-based topics/sorting activities. */
  color?: string;
  /** Onomatopoeia / sound word, used by animals & vehicles (e.g. "Moo!"). */
  sound?: LocalizedText;
  /** Numeric value, used by the numbers/counting topic. */
  value?: number;
  /** Optional grouping key used by sorting activities (e.g. "farm", "healthy") or opposite pairs (e.g. "size"). */
  group?: string;
  /** How to visually render this item. Defaults to "emoji". "shape" draws a CSS shape, "swatch" draws a solid color circle. */
  renderAs?: "emoji" | "shape" | "swatch";
  shapeKind?: "circle" | "square" | "triangle" | "rectangle";
}

export type ActivityType = "FIND" | "COUNT" | "MATCH" | "MEMORY" | "SORT";

export interface Topic {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  theme: ThemeKey;
  ageRange: string;
  vocabulary: VocabItem[];
  activityTypes: ActivityType[];
}

/** A ready-to-play activity instance produced by the generator for a given difficulty level. */
export interface GeneratedActivity {
  id: string;
  topicId: string;
  type: ActivityType;
  /** 1 = 2 choices, 2 = 3 choices, 3 = 4 choices. */
  difficulty: 1 | 2 | 3;
  promptText: LocalizedText;
  /** Items shown to the child to choose/sort/match/remember. */
  items: VocabItem[];
  /** id(s) of the correct item(s) within `items`. */
  correctIds: string[];
  /** For SORT: the two bucket definitions. */
  buckets?: { id: string; label: LocalizedText; icon: string }[];
  /** For MATCH: pairs of ids that belong together (left item id -> matching right item id). */
  pairs?: Record<string, string>;
  /** For MATCH: the right-hand column of tiles (left-hand column lives in `items`). */
  matchRightItems?: VocabItem[];
  /** For COUNT: the target number the child must find/tap. */
  targetCount?: number;
  /** For COUNT: the object repeated `targetCount` times for the child to count. */
  countObject?: VocabItem;
}

export interface ActivityResult {
  activityId: string;
  topicId: string;
  vocabId: string;
  correct: boolean;
  attempts: number;
  hintsUsed: number;
  responseTimeMs: number;
  timestamp: number;
  /**
   * True for quiz-style activities (FIND/COUNT) where `correct` reflects a
   * genuine right/wrong answer. MATCH/MEMORY/SORT report every vocab item as
   * `correct: true` once the game is completed (there's no wrong answer to
   * a completed sorting game), so they're excluded from accuracy stats to
   * avoid inflating what "accuracy" means to a parent.
   */
  graded: boolean;
}

export interface LearningSession {
  id: string;
  topicIds: string[];
  activities: GeneratedActivity[];
  currentIndex: number;
  startedAt: number;
  completedAt?: number;
  results: ActivityResult[];
  rewardsEarned: RewardBundle;
}

export interface RewardBundle {
  stars: number;
  hearts: number;
  rainbows: number;
  balloons: number;
  stickerIds: string[];
}

export interface MasteryEntry {
  score: number; // 0-100
  correctStreak: number;
  totalAttempts: number;
  totalCorrect: number;
  lastSeenAt: number;
}

export interface TopicProgress {
  topicId: string;
  masteryByVocab: Record<string, MasteryEntry>;
  overallMastery: number; // 0-100 aggregate across vocabulary
  activitiesCompleted: number;
  lastPracticedAt?: number;
  /** Adaptive difficulty: 1 = 2 choices, 2 = 3 choices, 3 = 4 choices. */
  difficultyLevel: 1 | 2 | 3;
  recentCorrectStreak: number;
  recentIncorrectStreak: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  ageYears: number;
  language: Lang;
  avatar: string;
  createdAt: number;
}

export interface StickerDef {
  id: string;
  emoji: string;
  /** Which world's sticker book this belongs in - lets the Sticker Book group by world instead of an arbitrary category. */
  worldId: string;
  label: LocalizedText;
}

export interface RewardState {
  stars: number;
  hearts: number;
  rainbows: number;
  balloons: number;
  stickerIds: string[];
  dailyStreak: number;
  lastSessionDay?: string; // YYYY-MM-DD
  /** World ids whose "You explored it!" celebration has already been shown once. */
  celebratedWorldIds: string[];
  /** Whether the very-first-ever activity celebration has been shown. */
  hasCelebratedFirstActivity: boolean;
}

// ---------------------------------------------------------------------------
// World layer: a storybook-map presentation wrapped around the existing
// topic/activity engine. A World never carries its own educational content -
// it just points at a Topic (via topicId) and adds theming, so the same
// Colors content can appear inside Rainbow Garden, in Today's Adventure, or
// in a parent-built session without any duplicated logic.
// ---------------------------------------------------------------------------

export interface World {
  id: string;
  title: LocalizedText;
  tagline: LocalizedText;
  icon: string;
  theme: ThemeKey;
  /** The Topic this world's activities are generated from. */
  topicId: string;
  /** Small decorative emoji scattered around the world's background. */
  ambientEmojis: string[];
  /** Activities-explored count at which the world is considered "fully grown". */
  explorationTarget: number;
  /** Shown to parents: what this world is actually teaching. */
  skills: LocalizedText[];
  /** Position along the map path, left to right / start to end. */
  order: number;
}

// ---------------------------------------------------------------------------
// Mini interactive stories: a short guided sequence that wraps a couple of
// narration beats around a real activity (generated by the same engine every
// other activity uses), so "find the red balloon" can be framed as "help
// Bunny find the red balloon" instead of a bare quiz question.
// ---------------------------------------------------------------------------

export type MascotMood = "idle" | "happy" | "excited" | "celebrating" | "thinking" | "sleepy" | "encouraging";

export interface StoryScene {
  id: string;
  kind: "narration" | "activity";
  /** narration scenes: */
  mascotMood?: MascotMood;
  line?: LocalizedText;
  emoji?: string;
  /** activity scenes: generated fresh from the same engine as everywhere else. */
  activityTopicId?: string;
  activityType?: ActivityType;
  /** FIND only: pins the activity to a specific vocab item so it matches the narration (e.g. "find the RED balloon" must generate a find-red activity, not a random color). */
  forcedVocabId?: string;
}

export interface Story {
  id: string;
  worldId: string;
  title: LocalizedText;
  icon: string;
  scenes: StoryScene[];
}

// ---------------------------------------------------------------------------
// Curriculum layer: a lightweight, transparent, rule-based model sitting on
// top of the existing per-vocab MasteryEntry data (see TopicProgress) - it
// adds structure (domains, prerequisites, curriculum sequencing) without any
// new persisted state of its own. A Skill is just a named, categorized
// pointer at one (topicId, vocabId) pair; its "state" is always *derived*
// from the mastery data that already exists, never stored separately, so
// there is nothing to migrate and nothing that can drift out of sync.
// ---------------------------------------------------------------------------

/** Broad developmental areas used to group skills for the parent dashboard. Motor/interaction skills aren't a separate domain here - they're expressed through the SORT/MATCH/MEMORY activity types, which already cut across every topic. */
export type Domain = "language" | "cognitive" | "early_math" | "colors" | "shapes" | "nature" | "social_emotional";

/**
 * Describes interaction with the app, never a developmental diagnosis.
 * NOT_INTRODUCED: never attempted. INTRODUCED: just started (1-2 attempts).
 * PRACTICING: attempted several times, still low mastery. EMERGING: mastery
 * building. STRONG: consistently mastered. REVIEW: due for a spaced
 * refresher regardless of how strong it once was - never "forgotten",
 * never removed, just resurfaced.
 */
export type SkillState = "NOT_INTRODUCED" | "INTRODUCED" | "PRACTICING" | "EMERGING" | "STRONG" | "REVIEW";

/** Internal curriculum buckets for sequencing - never shown to the child as an academic grade. */
export type CurriculumLevel = "explorer" | "little_discoverer" | "curious_explorer";

export interface Skill {
  id: string;
  topicId: string;
  vocabId: string;
  domain: Domain;
  title: LocalizedText;
  ageRange: string;
  /** Skill ids that should already be comfortable before this one is introduced. */
  prerequisites: string[];
  curriculumLevel: CurriculumLevel;
}

/** A parent-set focus, never a checklist - completing it is just a gentle acknowledgment. */
export interface LearningGoal {
  topicId: string;
  setAt: number;
}

export type Difficulty = "easy" | "normal" | "challenge";

export interface LearningPlan {
  id: string;
  topicIds: string[];
  durationMinutes: 5 | 10 | 15;
  difficulty: Difficulty;
  createdAt: number;
}

export interface AppSettings {
  language: Lang;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  volume: number; // 0-1
  reducedMotion: boolean;
  quietModeStart?: string; // "HH:MM"
  quietModeEnd?: string;
  enabledTopicIds: string[];
  difficulty: Difficulty;
  /** Softer, lower-energy experience for tired/wind-down moments: fewer big celebrations, gentler sounds. Unlike quiet-mode hours, this is a manual toggle, not time-based. */
  calmMode: boolean;
}

/** A session the child left mid-way through, so it can be resumed on return instead of forcing a restart. */
export interface InProgressSession {
  session: LearningSession;
  index: number;
  rewardsSoFar: RewardBundle;
}

export interface AppState {
  profile: ChildProfile | null;
  settings: AppSettings;
  rewards: RewardState;
  progress: Record<string, TopicProgress>;
  sessions: LearningSession[];
  onboardingComplete: boolean;
  inProgressSession: InProgressSession | null;
  currentGoal: LearningGoal | null;
}
