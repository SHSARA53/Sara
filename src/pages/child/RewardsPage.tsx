import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { RewardCounters } from "../../components/common/RewardCounters";
import { stickers } from "../../data/stickers";
import { Mascot } from "../../components/mascot/Mascot";

export function RewardsPage() {
  const { state } = useAppState();
  const { tr, ui } = useLang();

  const categories = ["animals", "fruits", "stars", "vehicles", "characters"] as const;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <div className="mb-6 flex flex-col items-center gap-3">
        <Mascot mood={state.rewards.stickerIds.length > 0 ? "happy" : "idle"} size={110} />
        <h1 className="text-2xl font-extrabold sm:text-3xl">{ui("rewards")}</h1>
        <RewardCounters rewards={state.rewards} />
      </div>

      <h2 className="mb-3 text-center text-lg font-bold text-choco/70">{ui("stickerCollection")}</h2>
      <div className="flex flex-col gap-6">
        {categories.map((category) => {
          const items = stickers.filter((sticker) => sticker.category === category);
          return (
            <div key={category} className="rounded-3xl bg-white/70 p-4">
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {items.map((sticker) => {
                  const owned = state.rewards.stickerIds.includes(sticker.id);
                  return (
                    <div
                      key={sticker.id}
                      className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-4xl shadow-sm ${
                        owned ? "bg-mint" : "bg-[#eee3d3] grayscale opacity-40"
                      }`}
                      title={tr(sticker.label)}
                    >
                      {owned ? sticker.emoji : "❔"}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
