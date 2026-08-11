import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { useAppState } from "./state/AppStateContext";
import { Mascot } from "./components/mascot/Mascot";

import { ChildLayout } from "./components/child/ChildLayout";
import { HomePage } from "./pages/child/HomePage";
import { TopicsPage } from "./pages/child/TopicsPage";
import { RewardsPage } from "./pages/child/RewardsPage";
import { SessionPage } from "./pages/child/SessionPage";
import { OnboardingPage } from "./pages/child/OnboardingPage";
import { FirstRunPage } from "./pages/child/FirstRunPage";

import { ParentLayout } from "./components/parent/ParentLayout";
import { DashboardPage } from "./pages/parent/DashboardPage";
import { TopicsConfigPage } from "./pages/parent/TopicsConfigPage";
import { LearningPlanPage } from "./pages/parent/LearningPlanPage";
import { SettingsPage } from "./pages/parent/SettingsPage";

function RequireProfile({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  if (!state.profile) return <Navigate to="/onboarding" replace />;
  if (!state.onboardingComplete) return <Navigate to="/firstrun" replace />;
  return <>{children}</>;
}

export default function App() {
  const { ready, state } = useAppState();

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream">
        <Mascot mood="idle" size={120} />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion={state.settings.reducedMotion ? "always" : "user"}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/firstrun" element={<FirstRunPage />} />

        <Route
          element={
            <RequireProfile>
              <ChildLayout />
            </RequireProfile>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
        </Route>

        <Route
          path="/session"
          element={
            <RequireProfile>
              <SessionPage />
            </RequireProfile>
          }
        />

        <Route
          path="/parent"
          element={
            <RequireProfile>
              <ParentLayout />
            </RequireProfile>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="topics" element={<TopicsConfigPage />} />
          <Route path="plan" element={<LearningPlanPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MotionConfig>
  );
}
