import type { World } from "../../models/types";
import { t } from "../topics/helpers";

/**
 * The world map is a storybook skin over the existing topic/activity engine
 * - a World never carries its own educational content, it just points at a
 * Topic (via topicId) and adds theming. The same Colors content this way
 * powers Rainbow Garden, Today's Adventure, and a parent-built session with
 * zero duplicated logic (see services/learning/activityGenerator.ts).
 */
export const worlds: World[] = [
  {
    id: "rainbow-garden",
    title: t("גן הקשת", "Rainbow Garden"),
    tagline: t("צבעים קסומים מסתתרים בין הפרחים", "Magical colors hide among the flowers"),
    icon: "🌈",
    theme: "berry",
    topicId: "colors",
    ambientEmojis: ["🌸", "🦋", "☁️", "🌷", "🌈"],
    explorationTarget: 7,
    skills: [t("זיהוי צבעים", "Color recognition"), t("התאמה", "Matching"), t("מיון", "Sorting")],
    order: 1,
  },
  {
    id: "animal-forest",
    title: t("יער החיות", "Animal Forest"),
    tagline: t("מי מתחבא מאחורי העצים?", "Who's hiding behind the trees?"),
    icon: "🐾",
    theme: "mint",
    topicId: "animals",
    ambientEmojis: ["🌳", "🍃", "🦋", "🐦", "🌿"],
    explorationTarget: 10,
    skills: [t("זיהוי בעלי חיים", "Animal recognition"), t("צלילי בעלי חיים", "Animal sounds"), t("התאמה", "Matching")],
    order: 2,
  },
  {
    id: "number-town",
    title: t("עיר המספרים", "Number Town"),
    tagline: t("בואו נספור את הבתים והבלונים", "Let's count the houses and balloons"),
    icon: "🔢",
    theme: "sun",
    topicId: "numbers",
    ambientEmojis: ["🏠", "🎈", "🚗", "⭐"],
    explorationTarget: 8,
    skills: [t("זיהוי מספרים", "Number recognition"), t("ספירה עד 5", "Counting 1-5"), t("יותר/פחות", "More vs less")],
    order: 3,
  },
  {
    id: "shape-mountain",
    title: t("הר הצורות", "Shape Mountain"),
    tagline: t("עיגולים, ריבועים ומשולשים מטפסים גבוה", "Circles, squares and triangles climbing high"),
    icon: "🔺",
    theme: "sky",
    topicId: "shapes",
    ambientEmojis: ["⛰️", "☁️", "🔺", "⚪"],
    explorationTarget: 6,
    skills: [t("זיהוי צורות", "Shape recognition"), t("התאמה", "Matching")],
    order: 4,
  },
  {
    id: "happy-kitchen",
    title: t("המטבח השמח", "Happy Kitchen"),
    tagline: t("מה טעים מסתתר בסלסלה?", "What's tasty hiding in the basket?"),
    icon: "🍎",
    theme: "peach",
    topicId: "food",
    ambientEmojis: ["🍎", "🍓", "🥕", "🍇"],
    explorationTarget: 9,
    skills: [t("זיהוי מאכלים", "Food recognition"), t("מיון פירות/ירקות", "Sorting fruit vs veg"), t("צבעים", "Colors")],
    order: 5,
  },
  {
    id: "little-city",
    title: t("העיר הקטנה", "Little City"),
    tagline: t("כלי רכב עוברים ברחובות", "Vehicles zoom through the streets"),
    icon: "🚗",
    theme: "sky",
    topicId: "vehicles",
    ambientEmojis: ["🚦", "🏢", "🚌", "☁️"],
    explorationTarget: 10,
    skills: [t("זיהוי כלי רכב", "Vehicle recognition"), t("צלילי כלי רכב", "Vehicle sounds"), t("התאמה", "Matching")],
    order: 6,
  },
  {
    id: "feelings-house",
    title: t("בית הרגשות", "Feelings House"),
    tagline: t("איך ארנבון מרגיש היום?", "How does Bunny feel today?"),
    icon: "😊",
    theme: "sun",
    topicId: "emotions",
    ambientEmojis: ["🏡", "💛", "☁️"],
    explorationTarget: 6,
    skills: [t("זיהוי רגשות", "Emotion recognition"), t("אמפתיה בסיסית", "Basic empathy")],
    order: 7,
  },
  {
    id: "body-house",
    title: t("בית הגוף שלי", "My Body House"),
    tagline: t("איפה האף שלך?", "Where is your nose?"),
    icon: "👀",
    theme: "lilac",
    topicId: "body",
    ambientEmojis: ["🏠", "✨"],
    explorationTarget: 8,
    skills: [t("זיהוי חלקי גוף", "Body part recognition"), t("ביצוע הוראות פשוטות", "Following simple instructions")],
    order: 8,
  },
  {
    id: "nature-park",
    title: t("פארק הטבע", "Nature Park"),
    tagline: t("שמש, עננים ופרפרים מחכים לגילוי", "Sun, clouds and butterflies waiting to be discovered"),
    icon: "🌳",
    theme: "mint",
    topicId: "nature",
    ambientEmojis: ["🌳", "🌸", "☀️", "🦋"],
    explorationTarget: 10,
    skills: [t("זיהוי עולם הטבע", "Nature recognition"), t("התאמה", "Matching"), t("מיון", "Sorting")],
    order: 9,
  },
  {
    id: "music-meadow",
    title: t("אחו המוזיקה", "Music Meadow"),
    tagline: t("איזה כלי עושה בּוּם בּוּם?", "Which instrument goes boom boom?"),
    icon: "🎵",
    theme: "lilac",
    topicId: "sounds",
    ambientEmojis: ["🎵", "🌼", "✨"],
    explorationTarget: 6,
    skills: [t("זיהוי צלילים", "Sound recognition"), t("הקשבה", "Listening"), t("התאמה", "Matching")],
    order: 10,
  },
];

export function getWorld(id: string): World | undefined {
  return worlds.find((world) => world.id === id);
}

export function getWorldByTopicId(topicId: string): World | undefined {
  return worlds.find((world) => world.topicId === topicId);
}

export const orderedWorlds = [...worlds].sort((a, b) => a.order - b.order);
