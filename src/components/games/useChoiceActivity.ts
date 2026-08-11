import { useEffect, useRef, useState } from "react";
import { playEffect, speak } from "../../services/audio/audioService";
import type { Lang, LocalizedText } from "../../models/types";
import type { ActivityOutcome } from "./types";

const MAX_ATTEMPTS_BEFORE_REVEAL = 3;

interface UseChoiceActivityArgs {
  correctId: string;
  vocabId: string;
  promptText: LocalizedText;
  lang: Lang;
  onResolved: (outcome: ActivityOutcome) => void;
}

/**
 * Shared "tap the right tile among a few choices" behavior used by FIND and
 * COUNT activities. Implements the progressive hint ladder: repeat the
 * question, then highlight the answer, then gently reveal it - never a hard
 * failure state.
 */
export function useChoiceActivity({ correctId, vocabId, promptText, lang, onResolved }: UseChoiceActivityArgs) {
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [hinted, setHinted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [locked, setLocked] = useState(false);
  const attemptsRef = useRef(0);
  const hintsRef = useRef(0);
  const startRef = useRef(Date.now());
  // Mirrors `resolved`/`locked` state but updates synchronously, so a fast
  // second tap during the ~0.5-1.1s pause before `finish()` actually fires
  // (very common - toddlers tap eagerly) can't sneak past the React state
  // update and record a second attempt, or worse, resolve the activity twice.
  const lockedRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    setWrongId(null);
    setHinted(false);
    setSelectedId(null);
    setResolved(false);
    setLocked(false);
    lockedRef.current = false;
    attemptsRef.current = 0;
    hintsRef.current = 0;
    const timer = setTimeout(() => speak(promptText, lang), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctId]);

  const finish = (correct: boolean) => {
    setResolved(true);
    onResolved({
      vocabResults: [{ vocabId, correct }],
      attempts: attemptsRef.current,
      hintsUsed: hintsRef.current,
    });
  };

  const handleTap = (id: string) => {
    if (lockedRef.current) return;
    attemptsRef.current += 1;

    if (id === correctId) {
      lockedRef.current = true;
      setLocked(true);
      setSelectedId(id);
      playEffect("success");
      setTimeout(() => finish(true), 500);
      return;
    }

    playEffect("errorGentle");
    setWrongId(id);
    setTimeout(() => setWrongId(null), 500);

    if (attemptsRef.current === 1) {
      hintsRef.current += 1;
      setTimeout(() => speak(promptText, lang), 600);
    } else if (attemptsRef.current === 2) {
      hintsRef.current += 1;
      setHinted(true);
      playEffect("hint");
    } else if (attemptsRef.current >= MAX_ATTEMPTS_BEFORE_REVEAL) {
      lockedRef.current = true;
      setLocked(true);
      hintsRef.current += 1;
      setHinted(true);
      setSelectedId(correctId);
      setTimeout(() => finish(false), 1100);
    }
  };

  return { wrongId, hinted, selectedId, resolved, locked, handleTap };
}
