import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mascot } from "../../components/mascot/Mascot";
import { BigButton } from "../../components/common/BigButton";
import { ActivityEngine, type EngineActivityResult } from "../../components/games/ActivityEngine";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { generateActivity } from "../../services/learning/activityGenerator";
import { colorsTopic } from "../../data/topics/topics";
import { speak } from "../../services/audio/audioService";

export function FirstRunPage() {
  const { completeOnboarding, recordAnswer } = useAppState();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [showActivity, setShowActivity] = useState(false);

  const demoActivity = useMemo(() => generateActivity(colorsTopic, "FIND", 1, {}), []);

  const startDemo = () => {
    speak({ he: "היי! אני ארנבון! רוצים ללמוד משהו כיף?", en: "Hi! I'm Bunny! Want to learn something fun?" }, lang);
    setShowActivity(true);
  };

  const handleComplete = (result: EngineActivityResult) => {
    for (const vr of result.vocabResults) recordAnswer(result.topicId, vr.vocabId, vr.correct);
    completeOnboarding();
    navigate("/");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      {!showActivity ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5">
          <Mascot mood="idle" size={170} />
          <h1 className="text-2xl font-extrabold">
            {lang === "he" ? "היי! אני ארנבון! 🐰" : "Hi! I'm Bunny! 🐰"}
          </h1>
          <p className="text-lg text-choco/70">
            {lang === "he" ? "רוצים ללמוד משהו כיף?" : "Want to learn something fun?"}
          </p>
          <BigButton onClick={startDemo}>{lang === "he" ? "כן!" : "Yes!"}</BigButton>
        </motion.div>
      ) : (
        <ActivityEngine activity={demoActivity} onComplete={handleComplete} />
      )}
    </div>
  );
}
