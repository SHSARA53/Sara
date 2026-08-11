import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Mascot } from "../../components/mascot/Mascot";
import { BigButton } from "../../components/common/BigButton";
import { RewardCounters } from "../../components/common/RewardCounters";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { getTodaysAdventureTopics, getAdventureDayLabel } from "../../services/learning/dailyAdventure";
import { getTopic } from "../../data/topics/topics";
import { speak } from "../../services/audio/audioService";
import { pick } from "../../utils/rng";
import { welcomePhrases } from "../../locales/phrases";

export function HomePage() {
  const { state } = useAppState();
  const { tr, ui, lang, dir } = useLang();
  const navigate = useNavigate();
  // "Forward" points away from the start of reading order: left in RTL, right in LTR.
  const ForwardIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  const adventureTopicIds = useMemo(() => {
    const todays = getTodaysAdventureTopics(state.profile?.createdAt ?? Date.now());
    const enabled = todays.filter((id) => state.settings.enabledTopicIds.includes(id));
    // Same fail-safe as TopicsPage: never show an empty adventure card just
    // because every topic happens to be disabled today.
    return enabled.length > 0 ? enabled : todays;
  }, [state.profile?.createdAt, state.settings.enabledTopicIds]);
  const adventureDay = getAdventureDayLabel(state.profile?.createdAt ?? Date.now());
  const adventureTopics = adventureTopicIds.map((id) => getTopic(id)).filter(Boolean);

  useEffect(() => {
    const timer = setTimeout(() => speak(pick(welcomePhrases), lang), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAdventure = () => {
    navigate("/session", { state: { topicIds: adventureTopicIds.length ? adventureTopicIds : ["colors"], durationMinutes: 8 } });
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 pt-8 text-center">
      <div className="flex w-full items-center justify-between">
        <span className="text-lg font-bold text-choco/70">{state.profile?.name}</span>
        <RewardCounters rewards={state.rewards} compact />
      </div>

      <Mascot mood="idle" size={150} />

      <h1 className="text-2xl font-extrabold sm:text-3xl">{ui("greetingMorning")}</h1>

      <div className="w-full rounded-[2rem] bg-white/80 p-6 shadow-md">
        <p className="mb-1 text-sm font-bold text-berry">
          {ui("todaysAdventure")} · {lang === "he" ? `יום ${adventureDay}` : `Day ${adventureDay}`}
        </p>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          {adventureTopics.map(
            (topic) =>
              topic && (
                <span key={topic.id} className="flex items-center gap-1 rounded-full bg-cream px-3 py-1 text-sm font-bold">
                  <span aria-hidden>{topic.icon}</span> {tr(topic.title)}
                </span>
              ),
          )}
        </div>
        <BigButton onClick={startAdventure} fullWidth>
          {ui("startLearning")}
        </BigButton>
      </div>

      {state.rewards.dailyStreak > 1 && (
        <p className="text-sm font-bold text-choco/60">
          🔥 {state.rewards.dailyStreak} {ui("streakLabel")}
        </p>
      )}

      <button
        type="button"
        onClick={() => navigate("/topics")}
        className="no-select flex items-center gap-1 text-sm font-bold text-choco/60 underline"
      >
        {ui("topics")} <ForwardIcon size={14} aria-hidden />
      </button>
    </div>
  );
}
