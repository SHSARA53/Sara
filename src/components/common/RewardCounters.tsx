import type { RewardState } from "../../models/types";

interface RewardCountersProps {
  rewards: RewardState;
  compact?: boolean;
}

export function RewardCounters({ rewards, compact }: RewardCountersProps) {
  const items: { emoji: string; value: number }[] = [
    { emoji: "⭐", value: rewards.stars },
    { emoji: "❤️", value: rewards.hearts },
    { emoji: "🌈", value: rewards.rainbows },
    { emoji: "🎈", value: rewards.balloons },
  ];

  return (
    <div className={`flex items-center gap-3 ${compact ? "text-sm" : "text-lg"}`}>
      {items.map((item) => (
        <span key={item.emoji} className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-bold shadow-sm">
          <span aria-hidden>{item.emoji}</span>
          {item.value}
        </span>
      ))}
    </div>
  );
}
