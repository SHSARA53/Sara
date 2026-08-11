import type {
  ActivityType,
  GeneratedActivity,
  LocalizedText,
  MasteryEntry,
  Topic,
  VocabItem,
} from "../../models/types";
import { gamesTopic, topics } from "../../data/topics/topics";
import { t } from "../../data/topics/helpers";
import { pick, sample, shuffle, weightedSample } from "../../utils/rng";
import { repetitionWeight } from "./mastery";

let uid = 0;
function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${uid}`;
}

function choiceCount(difficulty: 1 | 2 | 3): number {
  return difficulty + 1; // level1=2, level2=3, level3=4
}

interface GenOptions {
  rng?: () => number;
  masteryByVocab?: Record<string, MasteryEntry>;
}

/**
 * Vocabulary to draw an activity from. Most topics just use their own list;
 * a mixed topic like "games" (empty `vocabulary`) draws from every other
 * topic instead - without this, MATCH/MEMORY/SORT would silently generate
 * an empty, unplayable activity for it.
 */
function vocabPoolFor(topic: Topic): VocabItem[] {
  if (topic.vocabulary.length > 0) return topic.vocabulary;
  return topics.filter((topicItem) => topicItem.id !== topic.id).flatMap((topicItem) => topicItem.vocabulary);
}

function pickFocusVocab(topic: Topic, opts: GenOptions): VocabItem {
  const rng = opts.rng ?? Math.random;
  if (opts.masteryByVocab) {
    const [chosen] = weightedSample(
      topic.vocabulary,
      1,
      (item) => repetitionWeight(opts.masteryByVocab!, item.id),
      rng,
    );
    if (chosen) return chosen;
  }
  return pick(topic.vocabulary, rng);
}

function genFind(topic: Topic, difficulty: 1 | 2 | 3, opts: GenOptions): GeneratedActivity {
  const rng = opts.rng ?? Math.random;
  const n = Math.min(choiceCount(difficulty), topic.vocabulary.length);
  const correct = pickFocusVocab(topic, opts);
  const distractorPool = topic.vocabulary.filter((item) => item.id !== correct.id);
  const distractors = sample(distractorPool, n - 1, rng);
  const items = shuffle([correct, ...distractors], rng);

  return {
    id: nextId("find"),
    topicId: topic.id,
    type: "FIND",
    difficulty,
    promptText: t(`מצאו את ${correct.label.he}`, `Find the ${correct.label.en}`),
    items,
    correctIds: [correct.id],
  };
}

function genCount(topic: Topic, difficulty: 1 | 2 | 3, opts: GenOptions): GeneratedActivity {
  const rng = opts.rng ?? Math.random;
  const numbersTopic = topics.find((topicItem) => topicItem.id === "numbers")!;
  const maxN = Math.min(5, 2 + difficulty);
  const target = Math.floor(rng() * maxN) + 1;
  const objectVocab = topic.id === "numbers" ? pick(topics.find((topicItem) => topicItem.id === "animals")!.vocabulary, rng) : pick(topic.vocabulary, rng);

  const n = Math.min(choiceCount(difficulty), numbersTopic.vocabulary.length);
  const correctNumber = numbersTopic.vocabulary.find((item) => item.value === target)!;
  const distractorPool = numbersTopic.vocabulary.filter((item) => item.value !== target);
  const distractors = sample(distractorPool, n - 1, rng);
  const items = shuffle([correctNumber, ...distractors], rng);

  return {
    id: nextId("count"),
    topicId: topic.id,
    type: "COUNT",
    difficulty,
    promptText: t(`כמה ${objectVocab.label.he} יש?`, `How many ${objectVocab.label.en} are there?`),
    items,
    correctIds: [correctNumber.id],
    targetCount: target,
    countObject: objectVocab,
  };
}

function genMatch(topic: Topic, difficulty: 1 | 2 | 3, opts: GenOptions): GeneratedActivity {
  const rng = opts.rng ?? Math.random;
  const pool = vocabPoolFor(topic);
  const k = Math.min(1 + difficulty, pool.length, 4);
  const base = sample(pool, k, rng);

  const hasColor = base.every((item) => item.color);
  const hasSound = base.every((item) => item.sound);

  let rightItems: VocabItem[];
  let variant: "color" | "sound" | "twin";

  if (hasColor && rng() > 0.4) {
    variant = "color";
    rightItems = base.map((item) => ({
      id: `right-${item.id}`,
      label: item.label,
      emoji: "●",
      renderAs: "swatch",
      color: item.color,
      group: item.id,
    }));
  } else if (hasSound) {
    variant = "sound";
    rightItems = base.map((item) => ({
      id: `right-${item.id}`,
      label: item.sound!,
      emoji: "🔊",
      group: item.id,
    }));
  } else {
    variant = "twin";
    rightItems = base.map((item) => ({ ...item, id: `right-${item.id}`, group: item.id }));
  }

  const leftItems = base.map((item) => ({ ...item, id: `left-${item.id}`, group: item.id }));
  const pairs: Record<string, string> = {};
  base.forEach((item) => {
    pairs[`left-${item.id}`] = `right-${item.id}`;
  });

  return {
    id: nextId("match"),
    topicId: topic.id,
    type: "MATCH",
    difficulty,
    promptText:
      variant === "sound"
        ? t("התאימו כל חיה לצליל שלה", "Match each animal to its sound")
        : variant === "color"
          ? t("התאימו כל דבר לצבע שלו", "Match each item to its color")
          : t("מצאו את הזוגות", "Find the matching pairs"),
    items: shuffle(leftItems, rng),
    correctIds: [],
    pairs,
    matchRightItems: shuffle(rightItems, rng),
  };
}

function genMemory(topic: Topic, difficulty: 1 | 2 | 3, opts: GenOptions): GeneratedActivity {
  const rng = opts.rng ?? Math.random;
  const pool = vocabPoolFor(topic);
  const pairCount = Math.min(1 + difficulty, pool.length, 4);
  const base = sample(pool, pairCount, rng);

  const cards: VocabItem[] = shuffle(
    base.flatMap((item) => [
      { ...item, id: `${item.id}#a`, group: item.id },
      { ...item, id: `${item.id}#b`, group: item.id },
    ]),
    rng,
  );

  return {
    id: nextId("memory"),
    topicId: topic.id,
    type: "MEMORY",
    difficulty,
    promptText: t("מצאו את הזוגות התואמים", "Find the matching pairs"),
    items: cards,
    correctIds: [],
  };
}

/** Friendly names for the semantic `group` keys used across topics.ts. Anything not listed here falls back to the group's representative item's own label, never to a raw internal key. */
const GROUP_LABELS: Record<string, LocalizedText> = {
  warm: t("צבעים חמים", "Warm colors"),
  cool: t("צבעים קרים", "Cool colors"),
  fruit: t("פירות", "Fruits"),
  veg: t("ירקות", "Vegetables"),
  pet: t("חיות מחמד", "Pets"),
  farm: t("חיות משק", "Farm animals"),
  wild: t("חיות בר", "Wild animals"),
  water: t("יצורי מים", "Water creatures"),
  road: t("כלי רכב על כביש", "Road vehicles"),
  air: t("כלי טיס", "Flying vehicles"),
  rail: t("רכבות", "Trains"),
  emergency: t("רכבי חירום", "Emergency vehicles"),
};

function bucketLabel(key: string, representative: VocabItem | undefined): LocalizedText {
  return GROUP_LABELS[key] ?? representative?.label ?? t(key, key);
}

function genSort(topic: Topic, difficulty: 1 | 2 | 3, opts: GenOptions): GeneratedActivity {
  const rng = opts.rng ?? Math.random;
  const pool = vocabPoolFor(topic);
  const byGroup = new Map<string, VocabItem[]>();
  for (const item of pool) {
    const key = item.group ?? item.color ?? "other";
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(item);
  }

  // Prefer groups with at least 2 members so both baskets feel like a real
  // category rather than "here is the one and only red thing." Only fall
  // back to thinner groups if the topic's content doesn't offer richer ones.
  const allKeys = [...byGroup.keys()];
  const richKeys = allKeys.filter((key) => byGroup.get(key)!.length >= 2);
  const usableKeys = richKeys.length >= 2 ? richKeys : allKeys;
  const groupKeys = sample(usableKeys, 2, rng);

  const perBucket = Math.min(1 + difficulty, 3);
  let itemsA: VocabItem[];
  let itemsB: VocabItem[];
  let groupA: string;
  let groupB: string;

  if (groupKeys.length === 2) {
    [groupA, groupB] = groupKeys;
    itemsA = sample(byGroup.get(groupA) ?? [], perBucket, rng).map((item) => ({ ...item, group: groupA }));
    itemsB = sample(byGroup.get(groupB) ?? [], perBucket, rng).map((item) => ({ ...item, group: groupB }));
  } else {
    // Degenerate content (everything fell into one category, or the topic
    // only has one item) - split the pool in half so the game still works
    // instead of rendering an empty or nonsensical activity.
    groupA = "A";
    groupB = "B";
    const shuffled = shuffle(pool, rng);
    const half = Math.max(1, Math.ceil(Math.min(shuffled.length, perBucket * 2) / 2));
    itemsA = shuffled.slice(0, half).map((item) => ({ ...item, group: groupA }));
    itemsB = shuffled.slice(half, half + perBucket).map((item) => ({ ...item, group: groupB }));
  }

  const items = shuffle([...itemsA, ...itemsB], rng);
  const representative = (key: string, fallback: VocabItem[]): VocabItem | undefined => byGroup.get(key)?.[0] ?? fallback[0];

  return {
    id: nextId("sort"),
    topicId: topic.id,
    type: "SORT",
    difficulty,
    promptText: t("מיינו כל דבר לסל הנכון", "Sort each item into the right basket"),
    items,
    correctIds: [],
    buckets: [
      { id: groupA, label: bucketLabel(groupA, representative(groupA, itemsA)), icon: itemsA[0]?.emoji ?? "🧺" },
      { id: groupB, label: bucketLabel(groupB, representative(groupB, itemsB)), icon: itemsB[0]?.emoji ?? "🧺" },
    ],
  };
}

export function generateActivity(
  topic: Topic,
  type: ActivityType,
  difficulty: 1 | 2 | 3,
  opts: GenOptions = {},
): GeneratedActivity {
  switch (type) {
    case "FIND":
      return genFind(topic, difficulty, opts);
    case "COUNT":
      return genCount(topic, difficulty, opts);
    case "MATCH":
      return genMatch(topic, difficulty, opts);
    case "MEMORY":
      return genMemory(topic, difficulty, opts);
    case "SORT":
      return genSort(topic, difficulty, opts);
    default:
      return genFind(topic, difficulty, opts);
  }
}

export function availableActivityTypes(topic: Topic): ActivityType[] {
  if (topic.id === "games") return gamesTopic.activityTypes;
  return topic.activityTypes.filter((type) => type !== "COUNT" || topic.vocabulary.length > 0);
}
