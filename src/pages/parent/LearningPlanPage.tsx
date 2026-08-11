import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { BigButton } from "../../components/common/BigButton";
import { topics } from "../../data/topics/topics";
import type { Difficulty } from "../../models/types";
import { pick } from "../../utils/rng";

const durations: (5 | 10 | 15)[] = [5, 10, 15];
const difficultyLevel: Record<Difficulty, 1 | 2 | 3> = { easy: 1, normal: 2, challenge: 3 };

export function LearningPlanPage() {
  const { state } = useAppState();
  const { tr, ui } = useLang();
  const navigate = useNavigate();

  const enabledTopics = topics.filter((topic) => state.settings.enabledTopicIds.includes(topic.id));
  const [selected, setSelected] = useState<string[]>([]);
  const [duration, setDuration] = useState<5 | 10 | 15>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>(state.settings.difficulty);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const start = (topicIds: string[]) => {
    if (topicIds.length === 0 && enabledTopics.length === 0) return; // nothing to build a session from
    const resolvedTopicIds = topicIds.length ? topicIds : [pick(enabledTopics).id];
    navigate("/session", {
      state: { topicIds: resolvedTopicIds, durationMinutes: duration, difficultyOverride: difficultyLevel[difficulty] },
    });
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      <h2 className="text-lg font-bold">{ui("createPlan")}</h2>

      <div>
        <p className="mb-2 text-sm font-bold text-choco/60">{ui("topics")}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {enabledTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => toggle(topic.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-4 p-2 ${
                selected.includes(topic.id) ? "border-mint-dark bg-mint" : "border-transparent bg-white"
              }`}
            >
              <span className="text-2xl">{topic.icon}</span>
              <span className="text-xs font-bold">{tr(topic.title)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-choco/60">{ui("sessionDuration")}</p>
        <div className="flex gap-2">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${duration === d ? "bg-berry text-white" : "bg-white"}`}
            >
              {ui(d === 5 ? "duration5" : d === 10 ? "duration10" : "duration15")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-choco/60">{ui("difficultyLevel")}</p>
        <div className="flex gap-2">
          {(["easy", "normal", "challenge"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${difficulty === d ? "bg-sky-dark text-white" : "bg-white"}`}
            >
              {ui(d === "easy" ? "difficultyEasy" : d === "normal" ? "difficultyNormal" : "difficultyChallenge")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <BigButton onClick={() => start(selected)} disabled={selected.length === 0} fullWidth>
          {ui("startPlan")}
        </BigButton>
        <BigButton variant="ghost" onClick={() => start([])} disabled={enabledTopics.length === 0} fullWidth>
          {ui("surpriseMe")}
        </BigButton>
      </div>
    </div>
  );
}
