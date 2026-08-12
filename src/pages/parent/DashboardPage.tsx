import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { ProgressBar } from "../../components/common/ProgressBar";
import { BigButton } from "../../components/common/BigButton";
import { topics, getTopic } from "../../data/topics/topics";
import { getWorldByTopicId } from "../../data/worlds/worlds";
import { skills } from "../../data/curriculum/skills";
import { currentCurriculumLevel } from "../../services/learning/curriculumLevel";
import {
  localRuleBasedRecommendationService,
  recentlyPracticedTopics,
  growingSkillTopics,
  topicsGoodToReview,
  favoriteWorldTopics,
} from "../../services/learning/recommendationService";
import {
  sessionsForToday,
  minutesForSessions,
  accuracyForSessions,
  activitiesCompletedForSessions,
  groupSessionsByRecency,
} from "../../services/learning/dashboardStats";
import { buildWeeklySummary } from "../../services/learning/weeklySummary";
import { goalMastery as computeGoalMastery, isGoalComplete } from "../../services/learning/learningGoal";
import type { LocalizedText } from "../../models/types";

function worldOrTopicDisplay(topicId: string): { icon: string; title: LocalizedText; skills?: LocalizedText[] } | null {
  const world = getWorldByTopicId(topicId);
  if (world) return { icon: world.icon, title: world.title, skills: world.skills };
  const topic = getTopic(topicId);
  return topic ? { icon: topic.icon, title: topic.title } : null;
}

const STAGE_LABEL_KEY = {
  explorer: "stageExplorer",
  little_discoverer: "stageLittleDiscoverer",
  curious_explorer: "stageCuriousExplorer",
} as const;

export function DashboardPage() {
  const { state, setGoal } = useAppState();
  const { tr, ui } = useLang();
  const navigate = useNavigate();
  const [pickingGoal, setPickingGoal] = useState(false);

  const todaySessions = sessionsForToday(state.sessions);
  const minutesToday = minutesForSessions(todaySessions);
  const accuracyToday = accuracyForSessions(todaySessions);
  const grouped = groupSessionsByRecency(state.sessions);

  const recommendations = localRuleBasedRecommendationService.getRecommendations({
    progress: state.progress,
    sessions: state.sessions,
    enabledTopicIds: state.settings.enabledTopicIds,
  });
  const recentlyPracticed = recentlyPracticedTopics(state.sessions);
  const growing = growingSkillTopics(state.progress, state.settings.enabledTopicIds);
  const goodToReview = topicsGoodToReview(state.progress, state.settings.enabledTopicIds);
  const favorites = favoriteWorldTopics(state.sessions);
  const stage = currentCurriculumLevel(skills, state.progress);
  const weekly = buildWeeklySummary(state.sessions, state.progress, state.settings.enabledTopicIds);

  const visibleTopics = topics.filter((topic) => state.settings.enabledTopicIds.includes(topic.id) && topic.id !== "games");

  const startTopic = (topicId: string) => {
    navigate("/session", { state: { topicIds: [topicId], durationMinutes: 8 } });
  };

  const goalScore = state.currentGoal ? computeGoalMastery(state.currentGoal, state.progress) : 0;
  const goalComplete = state.currentGoal ? isGoalComplete(state.currentGoal, state.progress) : false;
  const goalDisplay = state.currentGoal ? worldOrTopicDisplay(state.currentGoal.topicId) : null;

  const renderSessionRow = (label: string, sessions: typeof state.sessions) =>
    sessions.length > 0 && (
      <div key={label} className="mb-3">
        <p className="mb-1 text-xs font-bold uppercase text-choco/50">{label}</p>
        {sessions.map((session) => (
          <div key={session.id} className="mb-1 flex items-center justify-between rounded-2xl bg-white px-4 py-2 text-sm">
            <span>{session.topicIds.map((id) => getTopic(id)?.icon).join(" ")}</span>
            <span className="font-bold">
              {minutesForSessions([session])} {ui("minutes")}
            </span>
          </div>
        ))}
      </div>
    );

  const chipRow = (topicIds: string[]) => (
    <div className="flex flex-wrap gap-2">
      {topicIds.map((topicId) => {
        const display = worldOrTopicDisplay(topicId);
        if (!display) return null;
        return (
          <span key={topicId} className="flex items-center gap-1 rounded-full bg-cream px-3 py-1 text-sm font-bold">
            <span aria-hidden>{display.icon}</span>
            {tr(display.title)}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 py-4">
      {state.rewards.dailyStreak > 1 && (
        <div className="rounded-2xl bg-sun px-4 py-2 text-center text-sm font-bold">
          🔥 {state.rewards.dailyStreak} {ui("streakLabel")}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <span className="text-xs font-bold uppercase text-choco/50">{ui("curriculumStage")}</span>
        <span className="font-bold text-berry">{ui(STAGE_LABEL_KEY[stage])}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={ui("todaysLearningTime")} value={`${minutesToday} ${ui("minutes")}`} />
        <StatCard label={ui("activitiesCompleted")} value={String(activitiesCompletedForSessions(todaySessions))} />
        <StatCard label={ui("accuracy")} value={`${accuracyToday}%`} />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-bold">{ui("learningGoal")}</h2>
        {state.currentGoal && goalDisplay ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold">
                <span className="text-2xl">{goalDisplay.icon}</span>
                {tr(goalDisplay.title)}
              </span>
              <button onClick={() => setGoal(null)} className="no-select text-sm font-bold text-choco/50 underline">
                {ui("clearGoal")}
              </button>
            </div>
            <ProgressBar value={goalScore} />
            <p className={`text-sm font-bold ${goalComplete ? "text-mint-dark" : "text-choco/60"}`}>
              {goalComplete ? ui("goalComplete") : ui("goalInProgress")}
            </p>
          </div>
        ) : pickingGoal ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-4 gap-2">
              {visibleTopics.map((topic) => {
                const display = worldOrTopicDisplay(topic.id)!;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setGoal({ topicId: topic.id, setAt: Date.now() });
                      setPickingGoal(false);
                    }}
                    className="flex flex-col items-center gap-1 rounded-2xl bg-cream p-2"
                  >
                    <span className="text-2xl">{display.icon}</span>
                    <span className="text-xs font-bold">{tr(display.title)}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPickingGoal(false)} className="no-select text-sm font-bold text-choco/50 underline">
              {ui("back")}
            </button>
          </div>
        ) : (
          <BigButton variant="ghost" onClick={() => setPickingGoal(true)}>
            {ui("setGoal")}
          </BigButton>
        )}
      </section>

      {weekly.highlights.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-bold">{ui("weeklySummary")}</h2>
          <p className="mb-1 text-xs font-bold uppercase text-choco/50">{ui("thisWeekExplored")}</p>
          {chipRow(weekly.topicIds)}
          <ul className="my-3 flex flex-col gap-1 text-sm text-choco/80">
            {weekly.highlights.map((highlight, i) => (
              <li key={i}>✨ {tr(highlight)}</li>
            ))}
          </ul>
          {weekly.suggestedNextTopicIds.length > 0 && (
            <>
              <p className="mb-1 text-xs font-bold uppercase text-choco/50">{ui("suggestedNext")}</p>
              {chipRow(weekly.suggestedNextTopicIds)}
            </>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-bold">{ui("learningInsights")}</h2>
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          {recentlyPracticed.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-choco/50">{ui("recentlyPracticed")}</p>
              {chipRow(recentlyPracticed)}
            </div>
          )}

          {growing.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-choco/50">{ui("growingSkills")}</p>
              <div className="flex flex-wrap gap-2">
                {growing.map(({ topicId, skillTitle }, i) => (
                  <span key={`${topicId}-${i}`} className="rounded-full bg-mint px-3 py-1 text-sm font-bold">
                    {tr(skillTitle)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {goodToReview.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-choco/50">{ui("goodToReview")}</p>
              <div className="flex flex-col gap-2">
                {goodToReview.map((topicId) => {
                  const display = worldOrTopicDisplay(topicId);
                  if (!display) return null;
                  return (
                    <div key={topicId} className="flex items-center justify-between rounded-2xl bg-peach/40 px-3 py-2">
                      <span className="flex items-center gap-2 font-bold">
                        <span>{display.icon}</span>
                        {tr(display.title)}
                      </span>
                      <button
                        onClick={() => startTopic(topicId)}
                        className="no-select rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm"
                      >
                        {ui("startReview")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {favorites.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-choco/50">{ui("favoriteAdventures")}</p>
              {chipRow(favorites)}
            </div>
          )}
        </div>
      </section>

      {recommendations.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-bold">{ui("recommendations")}</h2>
          <div className="flex flex-col gap-2">
            {recommendations.map((rec) => {
              const display = worldOrTopicDisplay(rec.topicId);
              if (!display) return null;
              return (
                <div key={rec.topicId} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold">
                      <span className="text-2xl">{display.icon}</span>
                      {tr(display.title)}
                    </span>
                    <button
                      onClick={() => startTopic(rec.topicId)}
                      className="no-select rounded-full bg-berry px-4 py-2 text-sm font-bold text-white"
                    >
                      {ui("startRecommended")}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-choco/50">{tr(rec.reason)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-bold">{ui("progress")}</h2>
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
          {visibleTopics.map((topic) => {
            const display = worldOrTopicDisplay(topic.id)!;
            const entry = state.progress[topic.id];
            return (
              <div key={topic.id}>
                <div className="mb-1 flex items-center justify-between text-sm font-bold">
                  <span>
                    {display.icon} {tr(display.title)}
                  </span>
                  <span>{entry?.overallMastery ?? 0}%</span>
                </div>
                <ProgressBar value={entry?.overallMastery ?? 0} />
                {display.skills && (
                  <p className="mt-1 text-xs text-choco/50">
                    {ui("skillsTaught")}: {display.skills.map((skill) => tr(skill)).join(" · ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">{ui("sessionHistory")}</h2>
        {renderSessionRow(ui("today"), grouped.today)}
        {renderSessionRow(ui("yesterday"), grouped.yesterday)}
        {renderSessionRow(ui("thisWeek"), grouped.earlierThisWeek)}
        {grouped.today.length + grouped.yesterday.length + grouped.earlierThisWeek.length === 0 && (
          <p className="text-sm text-choco/50">—</p>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs text-choco/60">{label}</p>
    </div>
  );
}
