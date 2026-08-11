import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useLang } from "../../hooks/useLang";

const tabs = [
  { to: "/parent", label: "dashboard" as const },
  { to: "/parent/topics", label: "topics" as const },
  { to: "/parent/plan", label: "learningPlan" as const },
  { to: "/parent/settings", label: "settings" as const },
];

export function ParentLayout() {
  const { ui } = useLang();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f6f1e9] pb-10">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        <button onClick={() => navigate("/")} className="no-select rounded-full bg-cream px-4 py-2 text-sm font-bold">
          ← {ui("exit")}
        </button>
        <h1 className="text-lg font-extrabold">{ui("parentMode")}</h1>
        <span className="w-16" />
      </header>

      <nav className="flex justify-center gap-1 overflow-x-auto px-2 py-3">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/parent"}
            className={({ isActive }) =>
              `no-select whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${isActive ? "bg-berry text-white" : "bg-white text-choco"}`
            }
          >
            {ui(tab.label)}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto max-w-3xl px-4">
        <Outlet />
      </main>
    </div>
  );
}
