import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "../../components/mascot/Mascot";
import { BigButton } from "../../components/common/BigButton";
import { ActivityEngine, type EngineActivityResult } from "../../components/games/ActivityEngine";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { getStory } from "../../data/stories/stories";
import { getWorld } from "../../data/worlds/worlds";
import { getTopic } from "../../data/topics/topics";
import { generateActivity } from "../../services/learning/activityGenerator";
import { rewardForActivityResult } from "../../services/learning/rewardEngine";
import { speak } from "../../services/audio/audioService";
import type { ActivityResult, Lang, MascotMood } from "../../models/types";

export function StoryPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { tr, ui, lang } = useLang();
  const { recordAnswer, recordActivityComplete, addRewards } = useAppState();
  const navigate = useNavigate();

  const story = storyId ? getStory(storyId) : undefined;
  const world = story ? getWorld(story.worldId) : undefined;
  const [sceneIndex, setSceneIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const scene = story?.scenes[sceneIndex];

  const activity = useMemo(() => {
    if (!scene || scene.kind !== "activity" || !scene.activityTopicId || !scene.activityType) return null;
    const topic = getTopic(scene.activityTopicId);
    if (!topic) return null;
    return generateActivity(topic, scene.activityType, 1, { forcedVocabId: scene.forcedVocabId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]);

  if (!story || !scene) {
    navigate(world ? `/world/${world.id}` : "/map", { replace: true });
    return null;
  }

  const goNext = () => {
    if (sceneIndex + 1 >= story.scenes.length) {
      setFinished(true);
    } else {
      setSceneIndex((i) => i + 1);
    }
  };

  const handleActivityDone = (result: EngineActivityResult) => {
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
        graded: true,
      };
      addRewards(rewardForActivityResult(activityResult));
    }
    recordActivityComplete(result.topicId);
    goNext();
  };

  const backToWorld = () => navigate(world ? `/world/${world.id}` : "/map");

  if (finished) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <Mascot mood="celebrating" size={150} />
        <h1 className="text-2xl font-extrabold">{ui("wellDone")}</h1>
        <p className="text-choco/70">{tr(story.title)}</p>
        <BigButton onClick={backToWorld}>{ui("continue")}</BigButton>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <button
        type="button"
        onClick={backToWorld}
        className="no-select fixed start-4 top-4 z-40 rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow"
      >
        ✕ {ui("exit")}
      </button>

      <AnimatePresence mode="wait">
        {scene.kind === "narration" ? (
          <NarrationScene key={scene.id} line={tr(scene.line!)} emoji={scene.emoji} mood={scene.mascotMood ?? "idle"} lang={lang} onNext={goNext} />
        ) : (
          activity && (
            <motion.div key={scene.id} className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ActivityEngine activity={activity} onComplete={handleActivityDone} />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

function NarrationScene({
  line,
  emoji,
  mood,
  lang,
  onNext,
}: {
  line: string;
  emoji?: string;
  mood: MascotMood;
  lang: Lang;
  onNext: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => speak(line, lang), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  return (
    <motion.button
      type="button"
      onClick={onNext}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="no-select flex flex-col items-center gap-6"
    >
      {emoji && (
        <span className="text-5xl" aria-hidden>
          {emoji}
        </span>
      )}
      <Mascot mood={mood} size={150} />
      <p className="text-xl font-bold text-choco">{line}</p>
      <span className="text-sm font-bold text-choco/40">👆</span>
    </motion.button>
  );
}
