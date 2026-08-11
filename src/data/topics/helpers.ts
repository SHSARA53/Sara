import type { LocalizedText, VocabItem } from "../../models/types";

export function t(he: string, en: string): LocalizedText {
  return { he, en };
}

export function v(
  id: string,
  he: string,
  en: string,
  emoji: string,
  extra: Partial<VocabItem> = {},
): VocabItem {
  return { id, label: t(he, en), emoji, ...extra };
}
