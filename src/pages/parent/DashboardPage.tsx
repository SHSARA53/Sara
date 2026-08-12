import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { ProgressBar } from "../../components/common/ProgressBar";
import { topics, getTopic } from "../../data/topics/topics";
import { getWorldByTopicId } from "../../data/worlds/worlds";
import {
  sessionsForToday,
  minutesForSessions,
  accuracyForSessions,
  activitiesCompletedForSessions,
  groupSessionsByRecency,
  recommendTopics,
} from "../../services/learning/dashboardStats";
import type { LocalizedText } from "../../models/types";

function worldOrTopicDisplay(topicId: string): { icon: string; title: LocalizedText; skills?: LocalizedText[] } | null {
  const world = getWorldByTopicId(topicId);
  if (world) return { icon: world.icon, title: world.title, skills: world.skills };
  const topic = getTopic(topicId);
  return topic ? { icon: topic.icon, title: topic.title } : null;
}

export function DashboardPage() {
  const { state } = useAppState();
  const { tr, ui } = useLang();
  const navigate = useNavigate();

  const todaySessions = sessionsForToday(state.sessions);
  const minutesToday = minutesForSessions(todaySessions);
  const accuracyToday = accuracyForSessions(todaySessions);
  const grouped = groupSessionsByRecency(state.sessions);
  const recommendations = recommendTopics(state.progress, state.settings.enabledTopicIds);
  const favorite = recommendations.find((rec) => rec.reason === "favorite");

  const visibleTopics = topics.filter((topic) => state.settings.enabledTopicIds.includes(topic.id) && topic.id !== "games");

  const startRecommended = (topicId: string) => {
    navigate("/session", { state: { topicIds: [topicId], durationMinutes: 8 } });
  };

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

  return (
    <div className="flex flex-col gap-6 py-4">
      {state.rewards.dailyStreak > 1 && (
        <div className="rounded-2xl bg-sun px-4 py-2 text-center text-sm font-bold">
          🔥 {state.rewards.dailyStreak} {ui("streakLabel")}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={ui("todaysLearningTime")} value={`${minutesToday} ${ui("minutes")}`} />
        <StatCard label={ui("activitiesCompleted")} value={String(activitiesCompletedForSessions(todaySessions))} />
        <StatCard label={ui("accuracy")} value={`${accuracyToday}%`} />
      </div>

      {favorite &&
        (() => {
          const display = worldOrTopicDisplay(favorite.topicId);
          if (!display) return null;
          return (
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <span className="text-3xl">{display.icon}</span>
              <div>
                <p className="text-xs font-bold uppercase text-choco/50">{ui("favoriteWorld")}</p>
                <p className="font-bold">{tr(display.title)}</p>
              </div>
            </div>
          );
        })()}

      {recommendations.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-bold">{ui("recommendations")}</h2>
          <div className="flex flex-col gap-2">
            {recommendations.map((rec) => {
              const display = worldOrTopicDisplay(rec.topicId);
              if (!display) return null;
              return (
                <div key={rec.topicId} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="text-2xl">{display.icon}</span>
                    {tr(display.title)}
                  </span>
                  <button
                    onClick={() => startRecommended(rec.topicId)}
                    className="no-select rounded-full bg-berry px-4 py-2 text-sm font-bold text-white"
                  >
                    {ui("startRecommended")}
                  </button>
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
