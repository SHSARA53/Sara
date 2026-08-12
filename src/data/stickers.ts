import type { StickerDef } from "../models/types";
import { t } from "./topics/helpers";

/** Grouped by world (worldId) so the Sticker Book reads as "what did we find in each place" rather than an arbitrary category list. */
export const stickers: StickerDef[] = [
  // Rainbow Garden
  { id: "sticker-rainbow", emoji: "🌈", worldId: "rainbow-garden", label: t("קשת", "Rainbow") },
  { id: "sticker-flower", emoji: "🌸", worldId: "rainbow-garden", label: t("פרח", "Flower") },
  { id: "sticker-butterfly", emoji: "🦋", worldId: "rainbow-garden", label: t("פרפר", "Butterfly") },
  { id: "sticker-sun", emoji: "☀️", worldId: "rainbow-garden", label: t("שמש", "Sun") },

  // Animal Forest
  { id: "sticker-dog", emoji: "🐶", worldId: "animal-forest", label: t("כלבלב", "Puppy") },
  { id: "sticker-cat", emoji: "🐱", worldId: "animal-forest", label: t("חתלתול", "Kitten") },
  { id: "sticker-bunny", emoji: "🐰", worldId: "animal-forest", label: t("ארנבון", "Bunny") },
  { id: "sticker-lion", emoji: "🦁", worldId: "animal-forest", label: t("אריה", "Lion") },

  // Number Town
  { id: "sticker-star", emoji: "⭐", worldId: "number-town", label: t("כוכב", "Star") },
  { id: "sticker-balloon", emoji: "🎈", worldId: "number-town", label: t("בלון", "Balloon") },
  { id: "sticker-apple", emoji: "🍎", worldId: "number-town", label: t("תפוח", "Apple") },
  { id: "sticker-house", emoji: "🏠", worldId: "number-town", label: t("בית", "House") },

  // Shape Mountain
  { id: "sticker-triangle", emoji: "🔺", worldId: "shape-mountain", label: t("משולש", "Triangle") },
  { id: "sticker-circle", emoji: "⚪", worldId: "shape-mountain", label: t("עיגול", "Circle") },
  { id: "sticker-sparkle-shape", emoji: "✨", worldId: "shape-mountain", label: t("נצנוץ", "Sparkle") },

  // Happy Kitchen
  { id: "sticker-strawberry", emoji: "🍓", worldId: "happy-kitchen", label: t("תות", "Strawberry") },
  { id: "sticker-watermelon", emoji: "🍉", worldId: "happy-kitchen", label: t("אבטיח", "Watermelon") },
  { id: "sticker-carrot", emoji: "🥕", worldId: "happy-kitchen", label: t("גזר", "Carrot") },
  { id: "sticker-grapes", emoji: "🍇", worldId: "happy-kitchen", label: t("ענבים", "Grapes") },

  // Little City
  { id: "sticker-car", emoji: "🚗", worldId: "little-city", label: t("מכונית", "Car") },
  { id: "sticker-train", emoji: "🚂", worldId: "little-city", label: t("רכבת", "Train") },
  { id: "sticker-airplane", emoji: "✈️", worldId: "little-city", label: t("מטוס", "Airplane") },
  { id: "sticker-firetruck", emoji: "🚒", worldId: "little-city", label: t("מכבת אש", "Fire Truck") },

  // Feelings House
  { id: "sticker-happy-face", emoji: "😄", worldId: "feelings-house", label: t("פרצוף שמח", "Happy Face") },
  { id: "sticker-party", emoji: "🥳", worldId: "feelings-house", label: t("חוגגים", "Party") },
  { id: "sticker-sleepy-face", emoji: "😴", worldId: "feelings-house", label: t("פרצוף ישנוני", "Sleepy Face") },

  // My Body House
  { id: "sticker-eyes", emoji: "👀", worldId: "body-house", label: t("עיניים", "Eyes") },
  { id: "sticker-wave", emoji: "👋", worldId: "body-house", label: t("נפנוף", "Wave") },
  { id: "sticker-clap", emoji: "🙌", worldId: "body-house", label: t("מחיאות כפיים", "Clapping") },

  // Nature Park
  { id: "sticker-tree", emoji: "🌳", worldId: "nature-park", label: t("עץ", "Tree") },
  { id: "sticker-moon", emoji: "🌙", worldId: "nature-park", label: t("ירח", "Moon") },
  { id: "sticker-bird", emoji: "🐦", worldId: "nature-park", label: t("ציפור", "Bird") },

  // Music Meadow
  { id: "sticker-drum", emoji: "🥁", worldId: "music-meadow", label: t("תוף", "Drum") },
  { id: "sticker-bell", emoji: "🔔", worldId: "music-meadow", label: t("פעמון", "Bell") },
  { id: "sticker-guitar", emoji: "🎸", worldId: "music-meadow", label: t("גיטרה", "Guitar") },
];

export function getSticker(id: string): StickerDef | undefined {
  return stickers.find((sticker) => sticker.id === id);
}

export function stickersForWorld(worldId: string): StickerDef[] {
  return stickers.filter((sticker) => sticker.worldId === worldId);
}
