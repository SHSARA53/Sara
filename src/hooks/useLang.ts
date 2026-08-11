import { useCallback } from "react";
import type { LocalizedText } from "../models/types";
import { useAppState } from "../state/AppStateContext";
import { uiStrings, type UiStringKey } from "../locales/ui";

export function useLang() {
  const { state } = useAppState();
  const lang = state.settings.language;
  const dir = lang === "he" ? "rtl" : "ltr";

  const tr = useCallback((text: LocalizedText) => text[lang], [lang]);
  const ui = useCallback((key: UiStringKey) => uiStrings[key][lang], [lang]);

  return { lang, dir, tr, ui };
}
