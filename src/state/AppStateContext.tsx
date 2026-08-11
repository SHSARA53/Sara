import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { AppState, ChildProfile, LearningSession, RewardBundle } from "../models/types";
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
  addRewards: (bundle: RewardBundle) => void;
  addSession: (session: LearningSession) => void;
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
    });
  }, [state.settings.soundEnabled, state.settings.voiceEnabled, state.settings.volume]);

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
      addRewards: (bundle) => dispatch({ type: "ADD_REWARDS", bundle }),
      addSession: (session) => dispatch({ type: "ADD_SESSION", session }),
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
