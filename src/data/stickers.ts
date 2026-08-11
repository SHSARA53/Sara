import type { StickerDef } from "../models/types";
import { t } from "./topics/helpers";

export const stickers: StickerDef[] = [
  { id: "sticker-dog", emoji: "🐶", category: "animals", label: t("כלבלב", "Puppy") },
  { id: "sticker-cat", emoji: "🐱", category: "animals", label: t("חתלתול", "Kitten") },
  { id: "sticker-lion", emoji: "🦁", category: "animals", label: t("אריה", "Lion") },
  { id: "sticker-elephant", emoji: "🐘", category: "animals", label: t("פיל", "Elephant") },
  { id: "sticker-rabbit", emoji: "🐰", category: "animals", label: t("ארנבון", "Bunny") },
  { id: "sticker-apple", emoji: "🍎", category: "fruits", label: t("תפוח", "Apple") },
  { id: "sticker-strawberry", emoji: "🍓", category: "fruits", label: t("תות", "Strawberry") },
  { id: "sticker-watermelon", emoji: "🍉", category: "fruits", label: t("אבטיח", "Watermelon") },
  { id: "sticker-grapes", emoji: "🍇", category: "fruits", label: t("ענבים", "Grapes") },
  { id: "sticker-star1", emoji: "⭐", category: "stars", label: t("כוכב", "Star") },
  { id: "sticker-star2", emoji: "🌟", category: "stars", label: t("כוכב זוהר", "Shining Star") },
  { id: "sticker-star3", emoji: "✨", category: "stars", label: t("נצנצים", "Sparkles") },
  { id: "sticker-rainbow", emoji: "🌈", category: "stars", label: t("קשת", "Rainbow") },
  { id: "sticker-car", emoji: "🚗", category: "vehicles", label: t("מכונית", "Car") },
  { id: "sticker-train", emoji: "🚂", category: "vehicles", label: t("רכבת", "Train") },
  { id: "sticker-airplane", emoji: "✈️", category: "vehicles", label: t("מטוס", "Airplane") },
  { id: "sticker-firetruck", emoji: "🚒", category: "vehicles", label: t("מכבת אש", "Fire Truck") },
  { id: "sticker-bunny-hero", emoji: "🐰", category: "characters", label: t("ארנבון הגיבור", "Hero Bunny") },
  { id: "sticker-bunny-party", emoji: "🥳", category: "characters", label: t("ארנבון חוגג", "Party Bunny") },
  { id: "sticker-bunny-sleep", emoji: "😴", category: "characters", label: t("ארנבון ישנוני", "Sleepy Bunny") },
];

export function getSticker(id: string): StickerDef | undefined {
  return stickers.find((sticker) => sticker.id === id);
}
