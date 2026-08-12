import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ParentGateButton } from "../common/ParentGateButton";
import { useLang } from "../../hooks/useLang";
import { useAppState } from "../../state/AppStateContext";
import { isQuietTime } from "../../utils/quietMode";
import { QuietModeScreen } from "./QuietModeScreen";

const navItems = [
  { to: "/", label: "home" as const, icon: "🏠" },
  { to: "/map", label: "learn" as const, icon: "🗺️" },
  { to: "/rewards", label: "rewards" as const, icon: "⭐" },
];

export function ChildLayout() {
  const { ui } = useLang();
  const navigate = useNavigate();
  const { state } = useAppState();

  if (isQuietTime(state.settings.quietModeStart, state.settings.quietModeEnd)) {
    return <QuietModeScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-[#fff1e0] pb-28">
      <Outlet />

      <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 flex justify-center">
        <div className="m-3 flex w-full max-w-md items-center justify-around rounded-[2rem] bg-white/90 px-3 py-2 shadow-xl backdrop-blur">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`no-select flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 ${
                    isActive ? "bg-bubblegum" : ""
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-xs font-bold">{ui(item.label)}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <ParentGateButton onUnlock={() => navigate("/parent")} />
    </div>
  );
}
