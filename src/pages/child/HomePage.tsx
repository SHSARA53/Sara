import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Mascot } from "../../components/mascot/Mascot";
import { BigButton } from "../../components/common/BigButton";
import { RewardCounters } from "../../components/common/RewardCounters";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { getTodaysAdventureTopics, getAdventureDayLabel } from "../../services/learning/dailyAdventure";
import { getWorldByTopicId } from "../../data/worlds/worlds";
import { speak } from "../../services/audio/audioService";
import { pick } from "../../utils/rng";
import { welcomePhrases, surprisePhrases } from "../../locales/phrases";
import { isReturningAfterGap } from "../../services/learning/streak";

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
  const adventureWorlds = adventureTopicIds.map((id) => getWorldByTopicId(id)).filter(Boolean);

  const returningAfterGap = isReturningAfterGap(state.rewards.lastSessionDay);

  useEffect(() => {
    const phrase = returningAfterGap ? ui("missedYou") : pick(welcomePhrases)[lang];
    const timer = setTimeout(() => speak(phrase, lang), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAdventure = () => {
    navigate("/session", { state: { topicIds: adventureTopicIds.length ? adventureTopicIds : ["colors"], durationMinutes: 8 } });
  };

  const continueAdventure = () => {
    navigate("/session", { state: { resume: true } });
  };

  const surpriseMe = () => {
    const enabledTopics = state.settings.enabledTopicIds.length > 0 ? state.settings.enabledTopicIds : ["colors"];
    const topicId = pick(enabledTopics);
    speak(pick(surprisePhrases), lang);
    navigate("/session", { state: { topicIds: [topicId], durationMinutes: 7 } });
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 pt-8 text-center">
      <div className="flex w-full items-center justify-between">
        <span className="text-lg font-bold text-choco/70">{state.profile?.name}</span>
        <RewardCounters rewards={state.rewards} compact />
      </div>

      <Mascot mood={returningAfterGap ? "excited" : "idle"} size={150} />

      <h1 className="text-2xl font-extrabold sm:text-3xl">{returningAfterGap ? ui("missedYou") : ui("greetingMorning")}</h1>
      {returningAfterGap && <p className="text-choco/60">{ui("wantAdventure")}</p>}

      {state.inProgressSession && (
        <div className="w-full rounded-[2rem] bg-white/80 p-6 shadow-md">
          <p className="mb-3 text-lg font-bold">{ui("continueAdventure")}</p>
          <BigButton onClick={continueAdventure} fullWidth>
            {ui("continueAdventure")}
          </BigButton>
        </div>
      )}

      <div className="w-full rounded-[2rem] bg-white/80 p-6 shadow-md">
        <p className="mb-1 text-sm font-bold text-berry">
          {ui("todaysAdventureShort")} · {lang === "he" ? `יום ${adventureDay}` : `Day ${adventureDay}`}
        </p>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          {adventureWorlds.map(
            (world) =>
              world && (
                <span key={world.id} className="flex items-center gap-1 rounded-full bg-cream px-3 py-1 text-sm font-bold">
                  <span aria-hidden>{world.icon}</span> {tr(world.title)}
                </span>
              ),
          )}
        </div>
        <BigButton onClick={startAdventure} fullWidth>
          {ui("startLearning")}
        </BigButton>
      </div>

      <div className="flex w-full gap-3">
        <BigButton variant="secondary" onClick={() => navigate("/map")} fullWidth>
          🗺️ {ui("exploreWorld")}
        </BigButton>
        <BigButton variant="ghost" onClick={surpriseMe} fullWidth>
          🎁 {ui("surpriseMe")}
        </BigButton>
      </div>

      {state.rewards.dailyStreak > 1 && (
        <p className="text-sm font-bold text-choco/60">
          🔥 {state.rewards.dailyStreak} {ui("streakLabel")}
        </p>
      )}

      <button
        type="button"
        onClick={() => navigate("/rewards")}
        className="no-select flex items-center gap-1 text-sm font-bold text-choco/60 underline"
      >
        {ui("myStickerBook")} <ForwardIcon size={14} aria-hidden />
      </button>
    </div>
  );
}
