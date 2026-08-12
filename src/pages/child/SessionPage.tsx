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
import { buildAdventurePlan, buildAdaptiveSession, planTopicIds, type AdventurePlanSlot } from "../../services/learning/dailyAdventureEngine";
import { rewardForActivityResult, rewardForSessionCompletion, mergeRewardBundles, emptyRewardBundle } from "../../services/learning/rewardEngine";
import { getSticker } from "../../data/stickers";
import { getWorld, getWorldByTopicId } from "../../data/worlds/worlds";
import type { ActivityResult, LearningSession, RewardBundle } from "../../models/types";
import { speak, playEffect, stopSpeaking } from "../../services/audio/audioService";

interface SessionLocationState {
  topicIds?: string[];
  durationMinutes?: number;
  difficultyOverride?: 1 | 2 | 3;
  worldId?: string;
  resume?: boolean;
  /** Pre-built by HomePage's adaptive Today's Adventure, so what's shown and what's played always match exactly. */
  adventurePlan?: AdventurePlanSlot[];
}

type Phase = "intro" | "playing" | "break" | "chest" | "reveal" | "worldCelebration" | "complete";

export function SessionPage() {
  const { state, recordAnswer, recordActivityComplete, addRewards, addSession, setInProgressSession, celebrateWorld, celebrateFirstActivity } =
    useAppState();
  const { ui, lang, tr } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const locState = (location.state as SessionLocationState) ?? {};
  const isResume = Boolean(locState.resume && state.inProgressSession);
  const durationMinutes = locState.durationMinutes ?? 8;

  // Explicit topics (parent plan, "Explore this world", a story) always win.
  // With nothing explicit and nothing to resume, fall back to building an
  // adaptive plan right here - covers direct/bookmarked navigation to
  // /session, though the normal path is HomePage building the plan once and
  // handing it over via adventurePlan so what's previewed and what's played
  // are guaranteed to be the same session.
  const adventurePlan =
    locState.adventurePlan ??
    (!locState.topicIds?.length && !isResume
      ? buildAdventurePlan({
          enabledTopicIds: state.settings.enabledTopicIds,
          progress: state.progress,
          recentTopicIds: [...state.sessions]
            .sort((a, b) => b.startedAt - a.startedAt)
            .slice(0, 5)
            .flatMap((s) => s.topicIds)
            .filter((id, i, arr) => arr.indexOf(id) === i),
          durationMinutes,
        })
      : null);

  const topicIds = locState.topicIds?.length ? locState.topicIds : adventurePlan ? planTopicIds(adventurePlan) : ["colors"];
  const world = locState.worldId ? getWorld(locState.worldId) : topicIds.length === 1 ? getWorldByTopicId(topicIds[0]) : undefined;

  const [phase, setPhase] = useState<Phase>(isResume ? "playing" : "intro");
  const [session, setSession] = useState<LearningSession | null>(isResume ? (state.inProgressSession!.session) : null);
  const [index, setIndex] = useState(isResume ? state.inProgressSession!.index : 0);
  const [sessionRewards, setSessionRewards] = useState<RewardBundle>(isResume ? state.inProgressSession!.rewardsSoFar : emptyRewardBundle());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [justCompletedWorld, setJustCompletedWorld] = useState<typeof world>(undefined);
  const breakShown = useRef(false);

  const sessionRef = useRef<LearningSession | null>(isResume ? state.inProgressSession!.session : null);
  const priorExploredRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => speak(isResume ? ui("continueAdventure") : ui("startLearning"), lang), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = () => {
    // Snapshot "explored so far" before this session adds to it, so we can
    // tell whether this session is the one that pushes the world over its
    // exploration target (only meaningful for a single-world session).
    priorExploredRef.current = topicIds.length === 1 ? (state.progress[topicIds[0]]?.activitiesCompleted ?? 0) : 0;

    const built = adventurePlan
      ? buildAdaptiveSession(adventurePlan, state.progress, locState.difficultyOverride)
      : buildSession({
          topicIds,
          durationMinutes,
          progressByTopic: state.progress,
          difficultyOverride: locState.difficultyOverride,
        });
    sessionRef.current = built;
    setSession(built);
    setIndex(0);
    setPhase("playing");
    setInProgressSession({ session: built, index: 0, rewardsSoFar: emptyRewardBundle() });
  };

  const finishSession = (finalResults: ActivityResult[], finalRewards: RewardBundle) => {
    const currentSession = sessionRef.current as LearningSession;
    const completionBundle = rewardForSessionCompletion(state.rewards.stickerIds, world?.id);
    const totalBundle = mergeRewardBundles(finalRewards, completionBundle);
    setSessionRewards(totalBundle);

    const completedSession: LearningSession = {
      ...currentSession,
      results: finalResults,
      completedAt: Date.now(),
      rewardsEarned: totalBundle,
    };
    addSession(completedSession);
    addRewards(totalBundle);
    setInProgressSession(null);
    if (!state.rewards.hasCelebratedFirstActivity) celebrateFirstActivity();

    if (world && topicIds.length === 1) {
      const finalExplored = priorExploredRef.current + currentSession.activities.length;
      if (finalExplored >= world.explorationTarget && !state.rewards.celebratedWorldIds.includes(world.id)) {
        setJustCompletedWorld(world);
      }
    }

    playEffect("completion");
    speak(ui("youFoundTreasure"), lang);
    setPhase("chest");
  };

  const resultsRef = useRef<ActivityResult[]>([]);
  const rewardsRef = useRef<RewardBundle>(isResume ? state.inProgressSession!.rewardsSoFar : emptyRewardBundle());

  const handleActivityComplete = (result: EngineActivityResult) => {
    const currentSession = sessionRef.current!;
    let bundleForActivity = emptyRewardBundle();
    // Only FIND/COUNT have a genuine right/wrong answer; MATCH/MEMORY/SORT
    // always resolve as "correct" once solved, so they shouldn't count
    // toward the accuracy stat parents see on the dashboard.
    const activityType = currentSession.activities.find((a) => a.id === result.activityId)?.type;
    const graded = activityType === "FIND" || activityType === "COUNT";

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
        graded,
      };
      resultsRef.current.push(activityResult);
      bundleForActivity = mergeRewardBundles(bundleForActivity, rewardForActivityResult(activityResult));
    }
    recordActivityComplete(result.topicId);

    rewardsRef.current = mergeRewardBundles(rewardsRef.current, bundleForActivity);
    setSessionRewards(rewardsRef.current);

    const total = currentSession.activities.length;
    const nextIndex = index + 1;
    const midpoint = Math.floor(total / 2);

    if (nextIndex >= total) {
      finishSession(resultsRef.current, rewardsRef.current);
      return;
    }

    setInProgressSession({ session: currentSession, index: nextIndex, rewardsSoFar: rewardsRef.current });

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

  const exitToHome = () => {
    stopSpeaking();
    navigate("/");
  };

  const openChest = () => {
    playEffect("sticker");
    speak(ui("wellDone"), lang);
    setPhase("reveal");
  };

  const continueAfterReveal = () => {
    if (justCompletedWorld) {
      celebrateWorld(justCompletedWorld.id);
      setPhase("worldCelebration");
    } else {
      setPhase("complete");
    }
  };

  // Mid-activity, a single accidental tap must never silently discard the
  // session - a toddler brushing this button shouldn't lose the game. Once
  // there's nothing left to lose (intro screen, or the celebration at the
  // end), leaving is harmless and skips the confirmation. The in-progress
  // session itself is never cleared here, so leaving mid-activity can
  // always be resumed later from "Continue Adventure".
  const handleExitTap = () => {
    if (phase === "playing" || phase === "break") {
      stopSpeaking();
      setShowExitConfirm(true);
    } else {
      exitToHome();
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={handleExitTap}
        className="no-select fixed start-4 top-4 z-40 rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow"
      >
        ✕ {ui("exit")}
      </button>

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[2rem] bg-white p-6 text-center shadow-xl"
            >
              <Mascot mood="encouraging" size={90} />
              <h2 className="text-xl font-extrabold">{ui("exitConfirmTitle")}</h2>
              <p className="text-sm text-choco/70">{ui("exitConfirmBody")}</p>
              <div className="flex w-full flex-col gap-3">
                <BigButton onClick={() => setShowExitConfirm(false)} fullWidth>
                  {ui("keepPlaying")}
                </BigButton>
                <BigButton variant="ghost" onClick={exitToHome} fullWidth>
                  {ui("leaveAnyway")}
                </BigButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {!state.settings.calmMode && <Confetti count={14} />}
            <Mascot mood="celebrating" size={150} />
            <h2 className="text-2xl font-extrabold">{ui("takeABreak")}</h2>
            <BigButton onClick={() => setPhase("playing")}>{ui("continue")}</BigButton>
          </motion.div>
        )}

        {phase === "chest" && (
          <motion.div
            key="chest"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <Mascot mood="excited" size={140} />
            <h1 className="text-2xl font-extrabold sm:text-3xl">{ui("youFoundTreasure")}</h1>
            <motion.button
              type="button"
              onClick={openChest}
              whileTap={{ scale: 0.9 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="no-select text-8xl"
              aria-label={ui("openChest")}
            >
              🎁
            </motion.button>
            <BigButton onClick={openChest}>{ui("openChest")}</BigButton>
          </motion.div>
        )}

        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            {!state.settings.calmMode && <Confetti />}
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

            <BigButton onClick={continueAfterReveal}>{ui("continue")}</BigButton>
          </motion.div>
        )}

        {phase === "worldCelebration" && justCompletedWorld && (
          <motion.div
            key="worldCelebration"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            {!state.settings.calmMode && <Confetti />}
            <span className="text-7xl">{justCompletedWorld.icon}</span>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{ui("worldExplored")}</h1>
            <p className="text-lg font-bold text-berry">{tr(justCompletedWorld.title)}</p>
            <BigButton onClick={() => setPhase("complete")}>{ui("continue")}</BigButton>
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
            <Mascot mood="happy" size={150} />
            <h1 className="text-2xl font-extrabold sm:text-3xl">{ui("wellDone")}</h1>
            <BigButton onClick={exitToHome}>{ui("home")}</BigButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
