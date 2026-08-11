import { useNavigate } from "react-router-dom";
import { TopicCard } from "../../components/common/TopicCard";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { topics } from "../../data/topics/topics";

export function TopicsPage() {
  const { state } = useAppState();
  const { ui } = useLang();
  const navigate = useNavigate();

  // If a parent has (probably accidentally) disabled every topic, fall back
  // to showing them all rather than stranding the child on a blank grid.
  const filtered = topics.filter((topic) => state.settings.enabledTopicIds.includes(topic.id));
  const visibleTopics = filtered.length > 0 ? filtered : topics;

  const startTopic = (topicId: string) => {
    navigate("/session", { state: { topicIds: [topicId], durationMinutes: 7 } });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="mb-6 text-center text-2xl font-extrabold sm:text-3xl">{ui("topics")}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {visibleTopics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} onClick={() => startTopic(topic.id)} />
        ))}
      </div>
    </div>
  );
}
