import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { AppState, ChildProfile, InProgressSession, LearningSession, RewardBundle } from "../models/types";
import { appReducer, type AppAction } from "./appReducer";
import { createDefaultState } from "../services/storage/defaults";
import { storage } from "../services/storage/storageAdapter";
import { setAudioConfig } from "../services/audio/audioService";

interface AppStateContextValue {
  state: AppState;
  ready: boolean;
  setProfile: (profile: ChildProfile) => void;
  updateProfile: (patch: Partial<ChildProfile>) => void;
  updateSettings: (patch: Partial<AppState["settings"]>) => void;
  completeOnboarding: () => void;
  recordAnswer: (topicId: string, vocabId: string, correct: boolean) => void;
  recordActivityComplete: (topicId: string) => void;
  addRewards: (bundle: RewardBundle) => void;
  addSession: (session: LearningSession) => void;
  setInProgressSession: (value: InProgressSession | null) => void;
  celebrateWorld: (worldId: string) => void;
  celebrateFirstActivity: () => void;
  resetProgress: () => void;
  dispatch: (action: AppAction) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createDefaultState);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    storage.load().then((saved) => {
      if (cancelled) return;
      if (saved) dispatch({ type: "HYDRATE", state: saved });
      hydrated.current = true;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    void storage.save(state);
  }, [state]);

  useEffect(() => {
    setAudioConfig({
      soundEnabled: state.settings.soundEnabled,
      voiceEnabled: state.settings.voiceEnabled,
      volume: state.settings.volume,
      calm: state.settings.calmMode,
    });
  }, [state.settings.soundEnabled, state.settings.voiceEnabled, state.settings.volume, state.settings.calmMode]);

  useEffect(() => {
    document.documentElement.lang = state.settings.language;
    document.documentElement.dir = state.settings.language === "he" ? "rtl" : "ltr";
  }, [state.settings.language]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      ready,
      setProfile: (profile) => dispatch({ type: "SET_PROFILE", profile }),
      updateProfile: (patch) => dispatch({ type: "UPDATE_PROFILE", patch }),
      updateSettings: (patch) => dispatch({ type: "UPDATE_SETTINGS", patch }),
      completeOnboarding: () => dispatch({ type: "COMPLETE_ONBOARDING" }),
      recordAnswer: (topicId, vocabId, correct) => dispatch({ type: "RECORD_ANSWER", topicId, vocabId, correct }),
      recordActivityComplete: (topicId) => dispatch({ type: "RECORD_ACTIVITY_COMPLETE", topicId }),
      addRewards: (bundle) => dispatch({ type: "ADD_REWARDS", bundle }),
      addSession: (session) => dispatch({ type: "ADD_SESSION", session }),
      setInProgressSession: (value) => dispatch({ type: "SET_IN_PROGRESS_SESSION", value }),
      celebrateWorld: (worldId) => dispatch({ type: "CELEBRATE_WORLD", worldId }),
      celebrateFirstActivity: () => dispatch({ type: "CELEBRATE_FIRST_ACTIVITY" }),
      resetProgress: () => dispatch({ type: "RESET_PROGRESS" }),
      dispatch,
    }),
    [state, ready],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
