import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Mascot } from "../../components/mascot/Mascot";
import { BigButton } from "../../components/common/BigButton";
import { AmbientDecorations } from "../../components/common/AmbientDecorations";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { getWorld } from "../../data/worlds/worlds";
import { stickersForWorld } from "../../data/stickers";
import { storiesForWorld } from "../../data/stories/stories";
import { growthTier, decorationCountForTier } from "../../services/learning/worldGrowth";
import { themeGradientClass } from "../../utils/theme";
import { speak } from "../../services/audio/audioService";

export function WorldDetailPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const { state } = useAppState();
  const { tr, ui, lang, dir } = useLang();
  const navigate = useNavigate();

  const world = worldId ? getWorld(worldId) : undefined;
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  useEffect(() => {
    if (world) {
      const timer = setTimeout(() => speak(world.tagline, lang), 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world?.id]);

  if (!world) {
    navigate("/map", { replace: true });
    return null;
  }

  const explored = state.progress[world.topicId]?.activitiesCompleted ?? 0;
  const tier = growthTier(explored, world.explorationTarget);
  const decorationCount = decorationCountForTier(tier);
  const stickers = stickersForWorld(world.id);
  const collectedCount = stickers.filter((s) => state.rewards.stickerIds.includes(s.id)).length;
  const stories = storiesForWorld(world.id);

  const explore = () => {
    navigate("/session", { state: { topicIds: [world.topicId], durationMinutes: 7, worldId: world.id } });
  };

  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-b ${themeGradientClass[world.theme]} pb-16`}>
      <AmbientDecorations emojis={world.ambientEmojis} count={decorationCount} />

      <button
        type="button"
        onClick={() => navigate("/map")}
        className="no-select relative z-10 m-4 flex items-center gap-1 rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow"
      >
        <BackIcon size={16} aria-hidden /> {ui("worldMap")}
      </button>

      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center gap-4 px-6 pt-4 text-center">
        <Mascot mood="excited" size={130} />
        <span className="text-5xl" aria-hidden>
          {world.icon}
        </span>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{tr(world.title)}</h1>
        <p className="text-choco/70">{tr(world.tagline)}</p>

        <BigButton onClick={explore} fullWidth>
          {ui("startLearning")}
        </BigButton>

        {stories.map((story) => (
          <BigButton key={story.id} variant="ghost" onClick={() => navigate(`/story/${story.id}`)} fullWidth>
            📖 {ui("storyTime")}: {tr(story.title)}
          </BigButton>
        ))}

        {stickers.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-choco/50">
              {collectedCount}/{stickers.length}
            </p>
            <div className="flex gap-2">
              {stickers.map((sticker) => {
                const owned = state.rewards.stickerIds.includes(sticker.id);
                return (
                  <span
                    key={sticker.id}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-2xl ${owned ? "" : "opacity-40"}`}
                    title={owned ? tr(sticker.label) : ui("comingNextAdventure")}
                  >
                    {owned ? sticker.emoji : "✨"}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
