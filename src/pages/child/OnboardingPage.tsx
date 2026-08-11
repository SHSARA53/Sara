import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mascot } from "../../components/mascot/Mascot";
import { BigButton } from "../../components/common/BigButton";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { topics } from "../../data/topics/topics";
import type { Lang } from "../../models/types";

const avatars = ["🐰", "🐻", "🦊", "🐱"];
const AGES = [2, 3];

export function OnboardingPage() {
  const { setProfile, updateSettings } = useAppState();
  const { ui, tr } = useLang();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState(2);
  const [language, setLanguage] = useState<Lang>("he");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [interests, setInterests] = useState<string[]>(topics.map((topic) => topic.id));

  const toggleInterest = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const steps = 5;

  const finish = () => {
    setProfile({
      id: `child-${Date.now()}`,
      name: name.trim() || (language === "he" ? "החוקר הקטן" : "Little Explorer"),
      ageYears: age,
      language,
      avatar,
      createdAt: Date.now(),
    });
    updateSettings({ language, enabledTopicIds: interests.length ? interests : topics.map((t) => t.id) });
    navigate("/firstrun");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <Mascot mood="idle" size={130} />

      {step === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{ui("onboardingWelcome")}</h1>
          <BigButton onClick={() => setStep(1)}>{ui("next")}</BigButton>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full flex-col items-center gap-4">
          <h2 className="text-xl font-bold">{ui("childName")}</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border-2 border-bubblegum px-4 py-3 text-center text-xl"
            placeholder="…"
          />
          <div className="flex gap-3">
            {avatars.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`rounded-2xl border-4 p-2 text-3xl ${avatar === a ? "border-mint-dark" : "border-transparent"}`}
              >
                {a}
              </button>
            ))}
          </div>
          <BigButton onClick={() => setStep(2)}>{ui("next")}</BigButton>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">{ui("childAge")}</h2>
          <div className="flex gap-4">
            {AGES.map((a) => (
              <button
                key={a}
                onClick={() => setAge(a)}
                className={`rounded-2xl border-4 px-6 py-4 text-2xl font-bold ${age === a ? "border-mint-dark bg-mint" : "border-transparent bg-white"}`}
              >
                {a}
              </button>
            ))}
          </div>
          <BigButton onClick={() => setStep(3)}>{ui("next")}</BigButton>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">{ui("chooseLanguage")}</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setLanguage("he")}
              className={`rounded-2xl border-4 px-6 py-4 text-xl font-bold ${language === "he" ? "border-mint-dark bg-mint" : "border-transparent bg-white"}`}
            >
              עברית
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`rounded-2xl border-4 px-6 py-4 text-xl font-bold ${language === "en" ? "border-mint-dark bg-mint" : "border-transparent bg-white"}`}
            >
              English
            </button>
          </div>
          <BigButton onClick={() => setStep(4)}>{ui("next")}</BigButton>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full flex-col items-center gap-4">
          <h2 className="text-xl font-bold">{ui("chooseInterests")}</h2>
          <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => toggleInterest(topic.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-4 p-2 ${
                  interests.includes(topic.id) ? "border-mint-dark bg-mint" : "border-transparent bg-white"
                }`}
              >
                <span className="text-2xl">{topic.icon}</span>
                <span className="text-xs font-bold">{tr(topic.title)}</span>
              </button>
            ))}
          </div>
          <BigButton onClick={finish}>{ui("letsStart")}</BigButton>
        </motion.div>
      )}

      <div className="flex gap-1">
        {Array.from({ length: steps }, (_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i === step ? "bg-berry" : "bg-[#e8ddce]"}`} />
        ))}
      </div>
    </div>
  );
}
