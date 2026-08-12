import { motion } from "framer-motion";
import type { Topic } from "../../models/types";
import { useLang } from "../../hooks/useLang";
import { themeBgClass } from "../../utils/theme";

interface TopicCardProps {
  topic: Topic;
  onClick: () => void;
}

export function TopicCard({ topic, onClick }: TopicCardProps) {
  const { tr } = useLang();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      whileHover={{ scale: 1.05, rotate: -1 }}
      className={`no-select flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[2rem] p-4 text-center shadow-md ${themeBgClass[topic.theme]}`}
    >
      <span className="text-5xl sm:text-6xl" aria-hidden>
        {topic.icon}
      </span>
      <span className="text-lg font-bold text-choco sm:text-xl">{tr(topic.title)}</span>
    </motion.button>
  );
}
