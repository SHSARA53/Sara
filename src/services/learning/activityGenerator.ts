import type {
  ActivityType,
  GeneratedActivity,
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
  const k = Math.min(1 + difficulty, topic.vocabulary.length, 4);
  const base = sample(topic.vocabulary, k, rng);

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
  const pairCount = Math.min(1 + difficulty, topic.vocabulary.length, 4);
  const vocabPool = topic.id === "games" ? shuffle(topics.filter((topicItem) => topicItem.id !== "games").flatMap((topicItem) => topicItem.vocabulary), rng) : topic.vocabulary;
  const base = sample(vocabPool, pairCount, rng);

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

function genSort(topic: Topic, difficulty: 1 | 2 | 3, opts: GenOptions): GeneratedActivity {
  const rng = opts.rng ?? Math.random;
  const byGroup = new Map<string, VocabItem[]>();
  for (const item of topic.vocabulary) {
    const key = item.group ?? item.color ?? "other";
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(item);
  }
  const groupKeys = sample([...byGroup.keys()].filter((key) => byGroup.get(key)!.length > 0), 2, rng);
  const [groupA, groupB] = groupKeys.length === 2 ? groupKeys : [groupKeys[0], groupKeys[0]];

  const perBucket = Math.min(1 + difficulty, 3);
  const itemsA = sample(byGroup.get(groupA) ?? [], perBucket, rng).map((item) => ({ ...item, group: groupA }));
  const itemsB = sample(byGroup.get(groupB) ?? [], perBucket, rng).map((item) => ({ ...item, group: groupB }));
  const items = shuffle([...itemsA, ...itemsB], rng);

  const bucketIcon = (key: string): string => {
    const sample1 = byGroup.get(key)?.[0];
    return sample1?.emoji ?? "🧺";
  };

  return {
    id: nextId("sort"),
    topicId: topic.id,
    type: "SORT",
    difficulty,
    promptText: t("מיינו כל דבר לסל הנכון", "Sort each item into the right basket"),
    items,
    correctIds: [],
    buckets: [
      { id: groupA, label: t(groupA, groupA), icon: bucketIcon(groupA) },
      { id: groupB, label: t(groupB, groupB), icon: bucketIcon(groupB) },
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
