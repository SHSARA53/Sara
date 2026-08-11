import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "../../components/mascot/Mascot";
import { BigButton } from "../../components/common/BigButton";
import { ProgressBar } from "../../components/common/ProgressBar";
import { Confetti } from "../../components/common/Confetti";
import { ActivityEngine, type EngineActivityResult } from "../../components/games/ActivityEngine";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { buildSession } from "../../services/learning/sessionGenerator";
import { getTodaysAdventureTopics } from "../../services/learning/dailyAdventure";
import { rewardForActivityResult, rewardForSessionCompletion, mergeRewardBundles, emptyRewardBundle } from "../../services/learning/rewardEngine";
import { getSticker } from "../../data/stickers";
import type { ActivityResult, LearningSession, RewardBundle } from "../../models/types";
import { speak, playEffect } from "../../services/audio/audioService";

interface SessionLocationState {
  topicIds?: string[];
  durationMinutes?: number;
  difficultyOverride?: 1 | 2 | 3;
}

type Phase = "intro" | "playing" | "break" | "complete";

export function SessionPage() {
  const { state, recordAnswer, addRewards, addSession } = useAppState();
  const { ui, lang, tr } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const locState = (location.state as SessionLocationState) ?? {};
  const topicIds = locState.topicIds?.length ? locState.topicIds : getTodaysAdventureTopics(state.profile?.createdAt ?? Date.now());
  const durationMinutes = locState.durationMinutes ?? 8;

  const [phase, setPhase] = useState<Phase>("intro");
  const [session, setSession] = useState<LearningSession | null>(null);
  const [index, setIndex] = useState(0);
  const [sessionRewards, setSessionRewards] = useState<RewardBundle>(emptyRewardBundle());
  const breakShown = useRef(false);

  const sessionRef = useRef<LearningSession | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => speak(ui("startLearning"), lang), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = () => {
    const built = buildSession({
      topicIds,
      durationMinutes,
      progressByTopic: state.progress,
      difficultyOverride: locState.difficultyOverride,
    });
    sessionRef.current = built;
    setSession(built);
    setIndex(0);
    setPhase("playing");
  };

  const finishSession = (finalResults: ActivityResult[], finalRewards: RewardBundle) => {
    const completionBundle = rewardForSessionCompletion(state.rewards.stickerIds);
    const totalBundle = mergeRewardBundles(finalRewards, completionBundle);
    setSessionRewards(totalBundle);

    const completedSession: LearningSession = {
      ...(sessionRef.current as LearningSession),
      results: finalResults,
      completedAt: Date.now(),
      rewardsEarned: totalBundle,
    };
    addSession(completedSession);
    addRewards(totalBundle);
    playEffect("completion");
    speak(ui("wellDone"), lang);
    setPhase("complete");
  };

  const resultsRef = useRef<ActivityResult[]>([]);
  const rewardsRef = useRef<RewardBundle>(emptyRewardBundle());

  const handleActivityComplete = (result: EngineActivityResult) => {
    const currentSession = sessionRef.current!;
    let bundleForActivity = emptyRewardBundle();

    for (const vr of result.vocabResults) {
      recordAnswer(result.topicId, vr.vocabId, vr.correct);
      const activityResult: ActivityResult = {
        activityId: result.activityId,
        topicId: result.topicId,
        vocabId: vr.vocabId,
        correct: vr.correct,
        attempts: result.attempts,
        hintsUsed: result.hintsUsed,
        responseTimeMs: result.responseTimeMs,
        timestamp: Date.now(),
      };
      resultsRef.current.push(activityResult);
      bundleForActivity = mergeRewardBundles(bundleForActivity, rewardForActivityResult(activityResult));
    }

    rewardsRef.current = mergeRewardBundles(rewardsRef.current, bundleForActivity);
    setSessionRewards(rewardsRef.current);

    const total = currentSession.activities.length;
    const nextIndex = index + 1;
    const midpoint = Math.floor(total / 2);

    if (nextIndex >= total) {
      finishSession(resultsRef.current, rewardsRef.current);
      return;
    }

    if (!breakShown.current && total >= 6 && nextIndex === midpoint) {
      breakShown.current = true;
      setPhase("break");
      setIndex(nextIndex);
      return;
    }

    setIndex(nextIndex);
  };

  const total = session?.activities.length ?? 0;
  const currentActivity = session?.activities[index];
  const earnedSticker = sessionRewards.stickerIds[0] ? getSticker(sessionRewards.stickerIds[0]) : undefined;

  const exitToHome = () => navigate("/");

  return (
    <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={exitToHome}
        className="no-select fixed start-4 top-4 z-40 rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow"
      >
        ✕ {ui("exit")}
      </button>

      {phase === "playing" && total > 0 && (
        <div className="fixed inset-x-0 top-4 z-30 mx-auto w-full max-w-sm px-16">
          <ProgressBar value={(index / total) * 100} colorClass="bg-berry" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <Mascot mood="idle" size={160} />
            <h1 className="text-2xl font-extrabold sm:text-3xl">{ui("startLearning")}</h1>
            <BigButton onClick={startSession}>{ui("continue")}</BigButton>
          </motion.div>
        )}

        {phase === "playing" && currentActivity && (
          <motion.div key={currentActivity.id} className="w-full pt-10">
            <ActivityEngine activity={currentActivity} onComplete={handleActivityComplete} />
          </motion.div>
        )}

        {phase === "break" && (
          <motion.div
            key="break"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <Confetti count={14} />
            <Mascot mood="celebrating" size={150} />
            <h2 className="text-2xl font-extrabold">{ui("takeABreak")}</h2>
            <BigButton onClick={() => setPhase("playing")}>{ui("continue")}</BigButton>
          </motion.div>
        )}

        {phase === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <Confetti />
            <Mascot mood="celebrating" size={170} />
            <h1 className="text-3xl font-extrabold">{ui("wellDone")}</h1>

            <div className="flex items-center gap-4 text-3xl">
              {sessionRewards.stars > 0 && <span>⭐×{sessionRewards.stars}</span>}
              {sessionRewards.hearts > 0 && <span>❤️×{sessionRewards.hearts}</span>}
              <span>🌈×{sessionRewards.rainbows}</span>
              <span>🎈×{sessionRewards.balloons}</span>
            </div>

            {earnedSticker && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
                className="flex flex-col items-center gap-1 rounded-3xl bg-white/80 px-6 py-4 shadow-md"
              >
                <span className="text-6xl">{earnedSticker.emoji}</span>
                <span className="text-sm font-bold text-choco/70">{tr(earnedSticker.label)}</span>
              </motion.div>
            )}

            <BigButton onClick={exitToHome}>{ui("home")}</BigButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
