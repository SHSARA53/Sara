import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Mascot } from "../../components/mascot/Mascot";
import { BigButton } from "../../components/common/BigButton";
import { RewardCounters } from "../../components/common/RewardCounters";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { getAdventureDayLabel } from "../../services/learning/dailyAdventure";
import { buildAdventurePlan, planTopicIds } from "../../services/learning/dailyAdventureEngine";
import { localRuleBasedRecommendationService } from "../../services/learning/recommendationService";
import { getWorldByTopicId, worlds } from "../../data/worlds/worlds";
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

  const recentTopicIds = useMemo(
    () =>
      [...state.sessions]
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 5)
        .flatMap((session) => session.topicIds)
        .filter((id, i, arr) => arr.indexOf(id) === i),
    [state.sessions],
  );

  // Built once per meaningful state change (not on every render) so the
  // topics previewed here are exactly what plays when "Start Learning" is
  // tapped - the plan travels to SessionPage via router state instead of
  // being re-derived (and re-randomized) there.
  const adventurePlan = useMemo(() => {
    // Today's Adventure stays within the named worlds on the map (matches
    // what the child sees there); "advanced practice" topics without a
    // world skin (opposites, the mixed games topic) stay reachable through
    // Explore World / parent-built plans instead of showing up unannounced.
    const worldTopicIds = worlds.map((world) => world.topicId);
    const enabledWorldTopicIds = state.settings.enabledTopicIds.filter((id) => worldTopicIds.includes(id));
    return buildAdventurePlan({
      enabledTopicIds: enabledWorldTopicIds,
      progress: state.progress,
      recentTopicIds,
      durationMinutes: 8,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.enabledTopicIds, state.progress, recentTopicIds]);
  const adventureTopicIds = planTopicIds(adventurePlan);
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
    navigate("/session", { state: { adventurePlan, durationMinutes: 8 } });
  };

  const continueAdventure = () => {
    navigate("/session", { state: { resume: true } });
  };

  const surpriseMe = () => {
    const recommendations = localRuleBasedRecommendationService.getRecommendations({
      progress: state.progress,
      sessions: state.sessions,
      enabledTopicIds: state.settings.enabledTopicIds,
    });
    const enabledTopics = state.settings.enabledTopicIds.length > 0 ? state.settings.enabledTopicIds : ["colors"];
    const topicId = recommendations[0]?.topicId ?? pick(enabledTopics);
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
