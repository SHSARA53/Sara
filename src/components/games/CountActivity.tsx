import type { GeneratedActivity } from "../../models/types";
import type { SubActivityProps } from "./types";
import { useChoiceActivity } from "./useChoiceActivity";
import { VocabTile } from "../common/VocabTile";
import { useLang } from "../../hooks/useLang";

interface CountActivityProps extends SubActivityProps {
  activity: GeneratedActivity;
}

export function CountActivity({ activity, lang, onResolved }: CountActivityProps) {
  const { tr } = useLang();
  const correctId = activity.correctIds[0];
  const { wrongId, hinted, selectedId, locked, handleTap } = useChoiceActivity({
    correctId,
    vocabId: correctId,
    promptText: activity.promptText,
    lang,
    onResolved,
  });

  const count = activity.targetCount ?? 1;
  const emoji = activity.countObject?.emoji ?? "⭐";

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">{tr(activity.promptText)}</h2>
      <div className="flex max-w-md flex-wrap items-center justify-center gap-3 rounded-3xl bg-white/70 p-4">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="text-5xl sm:text-6xl" aria-hidden>
            {emoji}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {activity.items.map((item) => (
          <VocabTile
            key={item.id}
            item={item}
            size="md"
            label={tr(item.label)}
            onClick={() => handleTap(item.id)}
            disabled={locked}
            selected={selectedId === item.id}
            wrong={wrongId === item.id}
            hinted={hinted && item.id === correctId}
          />
        ))}
      </div>
    </div>
  );
}
