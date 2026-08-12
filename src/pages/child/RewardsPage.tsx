import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { RewardCounters } from "../../components/common/RewardCounters";
import { stickersForWorld } from "../../data/stickers";
import { orderedWorlds } from "../../data/worlds/worlds";
import { Mascot } from "../../components/mascot/Mascot";

export function RewardsPage() {
  const { state } = useAppState();
  const { tr, ui } = useLang();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <div className="mb-6 flex flex-col items-center gap-3">
        <Mascot mood={state.rewards.stickerIds.length > 0 ? "happy" : "idle"} size={110} />
        <h1 className="text-2xl font-extrabold sm:text-3xl">{ui("myStickerBook")}</h1>
        <RewardCounters rewards={state.rewards} />
      </div>

      <div className="flex flex-col gap-6">
        {orderedWorlds.map((world) => {
          const items = stickersForWorld(world.id);
          const foundCount = items.filter((sticker) => state.rewards.stickerIds.includes(sticker.id)).length;
          return (
            <div key={world.id} className="rounded-3xl bg-white/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-choco/80">
                  <span className="text-2xl" aria-hidden>
                    {world.icon}
                  </span>
                  {tr(world.title)}
                </span>
                <span className="text-sm font-bold text-choco/50">
                  {foundCount}/{items.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {items.map((sticker) => {
                  const owned = state.rewards.stickerIds.includes(sticker.id);
                  return (
                    <div
                      key={sticker.id}
                      className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-4xl shadow-sm ${
                        owned ? "bg-mint" : "bg-[#eee3d3] opacity-50"
                      }`}
                      title={owned ? tr(sticker.label) : ui("comingNextAdventure")}
                    >
                      {owned ? sticker.emoji : "✨"}
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
