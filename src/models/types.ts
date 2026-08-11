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
  category: "animals" | "fruits" | "stars" | "vehicles" | "characters";
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
}

export interface AppState {
  profile: ChildProfile | null;
  settings: AppSettings;
  rewards: RewardState;
  progress: Record<string, TopicProgress>;
  sessions: LearningSession[];
  onboardingComplete: boolean;
}
