import type { GeneratedActivity } from "../../models/types";
import type { SubActivityProps } from "./types";
import { useChoiceActivity } from "./useChoiceActivity";
import { VocabTile } from "../common/VocabTile";
import { useLang } from "../../hooks/useLang";

interface FindActivityProps extends SubActivityProps {
  activity: GeneratedActivity;
}

export function FindActivity({ activity, lang, onResolved }: FindActivityProps) {
  const { tr } = useLang();
  const correctId = activity.correctIds[0];
  const { wrongId, hinted, selectedId, handleTap } = useChoiceActivity({
    correctId,
    vocabId: correctId,
    promptText: activity.promptText,
    lang,
    onResolved,
  });

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">{tr(activity.promptText)}</h2>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {activity.items.map((item) => (
          <VocabTile
            key={item.id}
            item={item}
            size="lg"
            label={tr(item.label)}
            onClick={() => handleTap(item.id)}
            selected={selectedId === item.id}
            wrong={wrongId === item.id}
            hinted={hinted && item.id === correctId}
          />
        ))}
      </div>
    </div>
  );
}
