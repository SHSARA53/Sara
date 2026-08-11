import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GeneratedActivity, LocalizedText } from "../../models/types";
import type { ActivityOutcome } from "./types";
import { FindActivity } from "./FindActivity";
import { CountActivity } from "./CountActivity";
import { MatchActivity } from "./MatchActivity";
import { MemoryActivity } from "./MemoryActivity";
import { SortActivity } from "./SortActivity";
import { FeedbackBanner } from "./FeedbackBanner";
import { Confetti } from "../common/Confetti";
import { Mascot, type MascotMood } from "../mascot/Mascot";
import { useLang } from "../../hooks/useLang";
import { speak, stopSpeaking } from "../../services/audio/audioService";
import { successPhrases, encouragePhrases, revealPhrases } from "../../locales/phrases";
import { pick } from "../../utils/rng";

export interface EngineActivityResult extends ActivityOutcome {
  activityId: string;
  topicId: string;
  responseTimeMs: number;
}

interface ActivityEngineProps {
  activity: GeneratedActivity;
  onComplete: (result: EngineActivityResult) => void;
}

export function ActivityEngine({ activity, onComplete }: ActivityEngineProps) {
  const { lang } = useLang();
  const [feedback, setFeedback] = useState<{ kind: "success" | "encourage" | "reveal"; text: LocalizedText } | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>("idle");
  const [showConfetti, setShowConfetti] = useState(false);
  const startRef = useRef(Date.now());
  // Belt-and-suspenders: even if a sub-activity's own guard ever slips (a
  // stray tap resolving twice), this stops a second onComplete from firing
  // for the same activity - which would otherwise double-record the answer
  // and skip the next activity in the session.
  const resolvedForRef = useRef<string | null>(null);

  useEffect(() => {
    startRef.current = Date.now();
    resolvedForRef.current = null;
    setFeedback(null);
    setMascotMood("idle");
    setShowConfetti(false);
    // Don't let a lingering "great job!" from the previous activity bleed
    // into this one's prompt.
    stopSpeaking();
    return () => stopSpeaking();
  }, [activity.id]);

  const handleResolved = (outcome: ActivityOutcome) => {
    if (resolvedForRef.current === activity.id) return;
    resolvedForRef.current = activity.id;

    const correctRatio = outcome.vocabResults.filter((r) => r.correct).length / Math.max(1, outcome.vocabResults.length);
    const fullyCorrect = correctRatio === 1;
    const usedNoHints = outcome.hintsUsed === 0;

    const kind: "success" | "encourage" | "reveal" = fullyCorrect ? "success" : outcome.hintsUsed <= 1 ? "encourage" : "reveal";
    const phrase = kind === "success" ? pick(successPhrases) : kind === "encourage" ? pick(encouragePhrases) : pick(revealPhrases);

    setFeedback({ kind, text: phrase });
    setMascotMood(fullyCorrect ? "celebrating" : kind === "encourage" ? "encouraging" : "idle");
    if (fullyCorrect && usedNoHints) setShowConfetti(true);
    speak(phrase, lang);

    const responseTimeMs = Date.now() - startRef.current;
    setTimeout(() => {
      onComplete({ ...outcome, activityId: activity.id, topicId: activity.topicId, responseTimeMs });
    }, 1500);
  };

  const commonProps = { activity, lang, onResolved: handleResolved };

  return (
    <div className="relative flex w-full flex-col items-center gap-8 px-4 py-6">
      <AnimatePresence>{showConfetti && <Confetti key={activity.id} />}</AnimatePresence>

      <motion.div
        key={activity.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="flex w-full flex-col items-center gap-6"
      >
        <Mascot mood={mascotMood} size={100} />

        {activity.type === "FIND" && <FindActivity {...commonProps} />}
        {activity.type === "COUNT" && <CountActivity {...commonProps} />}
        {activity.type === "MATCH" && <MatchActivity {...commonProps} />}
        {activity.type === "MEMORY" && <MemoryActivity {...commonProps} />}
        {activity.type === "SORT" && <SortActivity {...commonProps} />}
      </motion.div>

      <FeedbackBanner visible={Boolean(feedback)} kind={feedback?.kind ?? null} text={feedback?.text ?? null} />
    </div>
  );
}
