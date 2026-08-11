import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GeneratedActivity } from "../../models/types";
import type { SubActivityProps } from "./types";
import { VocabTile } from "../common/VocabTile";
import { useLang } from "../../hooks/useLang";
import { playEffect, speak } from "../../services/audio/audioService";

interface SortActivityProps extends SubActivityProps {
  activity: GeneratedActivity;
}

/**
 * Tap-to-sort instead of raw drag-and-drop: toddlers have unreliable
 * fine-motor precision, and a "select item, then tap the basket" flow
 * reaches the same learning goal without ever punishing an imprecise drop.
 */
export function SortActivity({ activity, lang, onResolved }: SortActivityProps) {
  const { tr } = useLang();
  const buckets = activity.buckets ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [shakeBucket, setShakeBucket] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const resolvedRef = useRef(false);

  useEffect(() => {
    speak(activity.promptText, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  const handleBucketTap = (bucketId: string) => {
    if (!selectedId) return;
    const item = activity.items.find((i) => i.id === selectedId);
    if (!item) return;
    attemptsRef.current += 1;
    const itemKey = item.group ?? item.color ?? "other";

    if (itemKey === bucketId) {
      playEffect("success");
      const next = new Set(placed);
      next.add(item.id);
      setPlaced(next);
      setSelectedId(null);

      if (next.size === activity.items.length && !resolvedRef.current) {
        resolvedRef.current = true;
        playEffect("celebration");
        const vocabResults = activity.items.map((i) => ({ vocabId: i.id, correct: true }));
        setTimeout(() => onResolved({ vocabResults, attempts: attemptsRef.current, hintsUsed: 0 }), 500);
      }
    } else {
      playEffect("errorGentle");
      setShakeBucket(bucketId);
      setTimeout(() => setShakeBucket(null), 450);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">{tr(activity.promptText)}</h2>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {activity.items
          .filter((item) => !placed.has(item.id))
          .map((item) => (
            <VocabTile
              key={item.id}
              item={item}
              size="md"
              label={tr(item.label)}
              onClick={() => setSelectedId(item.id)}
              selected={selectedId === item.id}
            />
          ))}
      </div>

      <div className="flex w-full max-w-md items-center justify-center gap-6">
        {buckets.map((bucket) => (
          <motion.button
            key={bucket.id}
            type="button"
            onClick={() => handleBucketTap(bucket.id)}
            animate={shakeBucket === bucket.id ? { x: [0, -8, 8, -8, 8, 0] } : {}}
            whileTap={{ scale: 0.95 }}
            className="flex h-28 flex-1 flex-col items-center justify-center gap-1 rounded-3xl border-4 border-dashed border-peach-dark bg-white/70 text-4xl shadow-inner"
          >
            <span aria-hidden>{bucket.icon}</span>
            <span className="text-sm font-semibold text-choco/70">🧺</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
