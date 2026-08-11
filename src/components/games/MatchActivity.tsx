import { useEffect, useRef, useState } from "react";
import type { GeneratedActivity } from "../../models/types";
import type { SubActivityProps } from "./types";
import { VocabTile } from "../common/VocabTile";
import { useLang } from "../../hooks/useLang";
import { playEffect, speak } from "../../services/audio/audioService";

interface MatchActivityProps extends SubActivityProps {
  activity: GeneratedActivity;
}

const AUTO_SOLVE_AFTER_WRONG = 6;

export function MatchActivity({ activity, lang, onResolved }: MatchActivityProps) {
  const { tr } = useLang();
  const rightItems = activity.matchRightItems ?? [];
  const pairs = activity.pairs ?? {};

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<{ left?: string; right?: string }>({});
  const attemptsRef = useRef(0);
  const wrongCountRef = useRef(0);
  const hintsRef = useRef(0);
  const resolvedRef = useRef(false);

  useEffect(() => {
    speak(activity.promptText, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  const finishIfDone = (nextSolved: Set<string>) => {
    if (nextSolved.size === Object.keys(pairs).length && !resolvedRef.current) {
      resolvedRef.current = true;
      playEffect("celebration");
      const vocabResults = Object.keys(pairs).map((leftId) => ({
        vocabId: activity.items.find((item) => item.id === leftId)?.group ?? leftId,
        correct: true,
      }));
      setTimeout(() => onResolved({ vocabResults, attempts: attemptsRef.current, hintsUsed: hintsRef.current }), 500);
    }
  };

  const handleRightTap = (rightId: string) => {
    if (!selectedLeft || solved.has(rightId)) return;
    attemptsRef.current += 1;

    if (pairs[selectedLeft] === rightId) {
      playEffect("success");
      const next = new Set(solved);
      next.add(selectedLeft);
      next.add(rightId);
      setSolved(next);
      setSelectedLeft(null);
      finishIfDone(next);
    } else {
      wrongCountRef.current += 1;
      playEffect("errorGentle");
      setWrongFlash({ left: selectedLeft, right: rightId });
      setTimeout(() => setWrongFlash({}), 450);
      setSelectedLeft(null);

      if (wrongCountRef.current >= AUTO_SOLVE_AFTER_WRONG) {
        wrongCountRef.current = 0;
        hintsRef.current += 1;
        const remainingLeft = Object.keys(pairs).find((id) => !solved.has(id));
        if (remainingLeft) {
          const next = new Set(solved);
          next.add(remainingLeft);
          next.add(pairs[remainingLeft]);
          setSolved(next);
          finishIfDone(next);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">{tr(activity.promptText)}</h2>
      <div className="flex w-full max-w-lg items-start justify-between gap-6">
        <div className="flex flex-1 flex-col items-center gap-4">
          {activity.items.map((item) => (
            <VocabTile
              key={item.id}
              item={item}
              size="sm"
              label={tr(item.label)}
              disabled={solved.has(item.id)}
              onClick={() => setSelectedLeft(item.id)}
              selected={selectedLeft === item.id}
              wrong={wrongFlash.left === item.id}
            />
          ))}
        </div>
        <div className="flex flex-1 flex-col items-center gap-4">
          {rightItems.map((item) => (
            <VocabTile
              key={item.id}
              item={item}
              size="sm"
              label={tr(item.label)}
              disabled={solved.has(item.id)}
              onClick={() => handleRightTap(item.id)}
              wrong={wrongFlash.right === item.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
