import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GeneratedActivity } from "../../models/types";
import type { SubActivityProps } from "./types";
import { useLang } from "../../hooks/useLang";
import { playEffect, speak } from "../../services/audio/audioService";

interface MemoryActivityProps extends SubActivityProps {
  activity: GeneratedActivity;
}

export function MemoryActivity({ activity, lang, onResolved }: MemoryActivityProps) {
  const { tr } = useLang();
  const [flipped, setFlipped] = useState<string[]>([]);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [shake, setShake] = useState<string[]>([]);
  const attemptsRef = useRef(0);
  const busyRef = useRef(false);
  const resolvedRef = useRef(false);

  useEffect(() => {
    speak(activity.promptText, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  const handleTap = (id: string) => {
    if (busyRef.current || solved.has(id) || flipped.includes(id)) return;
    const nextFlipped = [...flipped, id];
    setFlipped(nextFlipped);
    playEffect("tap");

    if (nextFlipped.length === 2) {
      busyRef.current = true;
      attemptsRef.current += 1;
      const [aId, bId] = nextFlipped;
      const a = activity.items.find((item) => item.id === aId)!;
      const b = activity.items.find((item) => item.id === bId)!;

      if (a.group === b.group) {
        setTimeout(() => {
          const nextSolved = new Set(solved);
          nextSolved.add(aId);
          nextSolved.add(bId);
          setSolved(nextSolved);
          setFlipped([]);
          busyRef.current = false;
          playEffect("success");

          if (nextSolved.size === activity.items.length && !resolvedRef.current) {
            resolvedRef.current = true;
            playEffect("celebration");
            const groups = new Set(activity.items.map((item) => item.group ?? item.id));
            const vocabResults = [...groups].map((vocabId) => ({ vocabId, correct: true }));
            setTimeout(
              () => onResolved({ vocabResults, attempts: attemptsRef.current, hintsUsed: 0 }),
              500,
            );
          }
        }, 550);
      } else {
        playEffect("errorGentle");
        setTimeout(() => {
          setShake(nextFlipped);
          setTimeout(() => {
            setShake([]);
            setFlipped([]);
            busyRef.current = false;
          }, 450);
        }, 500);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-center text-2xl font-bold sm:text-3xl">{tr(activity.promptText)}</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
        {activity.items.map((item) => {
          const isFlipped = flipped.includes(item.id) || solved.has(item.id);
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleTap(item.id)}
              animate={shake.includes(item.id) ? { x: [0, -6, 6, -6, 6, 0] } : {}}
              whileTap={{ scale: 0.92 }}
              className="no-select h-20 w-20 sm:h-24 sm:w-24"
              style={{ perspective: 600 }}
              aria-label={tr(item.label)}
            >
              <motion.div
                className="relative h-full w-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.35 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-lilac-dark text-3xl shadow-md"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  🌟
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-2xl border-4 border-mint-dark bg-white text-4xl shadow-md"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  {item.emoji}
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
