import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { orderedWorlds } from "../../data/worlds/worlds";
import { CircularProgress } from "../../components/common/CircularProgress";
import { AmbientDecorations } from "../../components/common/AmbientDecorations";
import { themeBgClass, themeAccentHex } from "../../utils/theme";
import type { World } from "../../models/types";

export function WorldMapPage() {
  const { state } = useAppState();
  const { ui } = useLang();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky to-cream pb-32">
      <AmbientDecorations emojis={["☁️", "⭐", "🎈", "✨", "🌤️"]} count={9} />

      <h1 className="relative z-10 pt-8 text-center text-2xl font-extrabold sm:text-3xl">{ui("worldMap")}</h1>

      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center px-6 pt-6">
        {orderedWorlds.map((world, i) => {
          const progress = state.progress[world.topicId];
          const explored = progress?.activitiesCompleted ?? 0;

          return (
            <div key={world.id} className={`flex w-full flex-col ${i % 2 === 0 ? "items-start" : "items-end"}`}>
              {i > 0 && <div className="my-1 h-8 w-1 self-center rounded-full border-2 border-dashed border-white/70" aria-hidden />}
              <WorldMapNode world={world} explored={explored} onClick={() => navigate(`/world/${world.id}`)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorldMapNode({ world, explored, onClick }: { world: World; explored: number; onClick: () => void }) {
  const { tr, ui } = useLang();
  const pct = Math.min(100, (explored / world.explorationTarget) * 100);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.03 }}
      className={`no-select flex w-52 flex-col items-center gap-2 rounded-[2rem] p-4 text-center shadow-lg ${themeBgClass[world.theme]}`}
    >
      <CircularProgress value={pct} fillColor={themeAccentHex[world.theme]} size={84}>
        <span className="text-4xl" aria-hidden>
          {world.icon}
        </span>
      </CircularProgress>
      <span className="font-extrabold text-choco">{tr(world.title)}</span>
      <span className="text-xs font-bold text-choco/60">
        {explored}/{world.explorationTarget} {ui("activitiesExplored")}
      </span>
    </motion.button>
  );
}
