import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { topics } from "../../data/topics/topics";

export function TopicsConfigPage() {
  const { state, updateSettings } = useAppState();
  const { tr, ui } = useLang();

  const toggleTopic = (id: string) => {
    const enabled = state.settings.enabledTopicIds.includes(id);
    const next = enabled
      ? state.settings.enabledTopicIds.filter((topicId) => topicId !== id)
      : [...state.settings.enabledTopicIds, id];
    updateSettings({ enabledTopicIds: next });
  };

  return (
    <div className="py-4">
      <h2 className="mb-4 text-lg font-bold">{ui("topics")}</h2>
      <div className="flex flex-col gap-2">
        {topics.map((topic) => {
          const enabled = state.settings.enabledTopicIds.includes(topic.id);
          return (
            <label
              key={topic.id}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
            >
              <span className="flex items-center gap-3 font-bold">
                <span className="text-2xl">{topic.icon}</span>
                {tr(topic.title)}
              </span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggleTopic(topic.id)}
                className="h-6 w-6 accent-[#ff8fab]"
                aria-label={`${ui("enableTopic")} ${tr(topic.title)}`}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
