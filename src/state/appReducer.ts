import type {
  AppSettings,
  AppState,
  ChildProfile,
  LearningSession,
  RewardBundle,
} from "../models/types";
import { adjustDifficulty, createEmptyTopicProgress, updateMastery, computeOverallMastery } from "../services/learning/mastery";
import { updateStreak } from "../services/learning/streak";

export type AppAction =
  | { type: "HYDRATE"; state: AppState }
  | { type: "SET_PROFILE"; profile: ChildProfile }
  | { type: "UPDATE_PROFILE"; patch: Partial<ChildProfile> }
  | { type: "UPDATE_SETTINGS"; patch: Partial<AppSettings> }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "RECORD_ANSWER"; topicId: string; vocabId: string; correct: boolean }
  | { type: "ADD_REWARDS"; bundle: RewardBundle }
  | { type: "ADD_SESSION"; session: LearningSession }
  | { type: "RESET_PROGRESS" };

const MAX_STORED_SESSIONS = 120;

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "SET_PROFILE":
      return { ...state, profile: action.profile };

    case "UPDATE_PROFILE":
      return state.profile ? { ...state, profile: { ...state.profile, ...action.patch } } : state;

    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case "COMPLETE_ONBOARDING":
      return { ...state, onboardingComplete: true };

    case "RECORD_ANSWER": {
      const existing = state.progress[action.topicId] ?? createEmptyTopicProgress(action.topicId);
      const now = Date.now();
      const nextMasteryEntry = updateMastery(existing.masteryByVocab[action.vocabId], action.correct, now);
      const masteryByVocab = { ...existing.masteryByVocab, [action.vocabId]: nextMasteryEntry };
      const withDifficulty = adjustDifficulty(existing, action.correct);

      const nextProgress = {
        ...withDifficulty,
        masteryByVocab,
        overallMastery: computeOverallMastery(masteryByVocab),
        activitiesCompleted: existing.activitiesCompleted + 1,
        lastPracticedAt: now,
      };

      return {
        ...state,
        progress: { ...state.progress, [action.topicId]: nextProgress },
      };
    }

    case "ADD_REWARDS": {
      const { bundle } = action;
      const newStickerIds = bundle.stickerIds.filter((id) => !state.rewards.stickerIds.includes(id));
      return {
        ...state,
        rewards: {
          ...state.rewards,
          stars: state.rewards.stars + bundle.stars,
          hearts: state.rewards.hearts + bundle.hearts,
          rainbows: state.rewards.rainbows + bundle.rainbows,
          balloons: state.rewards.balloons + bundle.balloons,
          stickerIds: [...state.rewards.stickerIds, ...newStickerIds],
        },
      };
    }

    case "ADD_SESSION": {
      const { streak, day } = updateStreak(state.rewards.dailyStreak, state.rewards.lastSessionDay);
      const sessions = [action.session, ...state.sessions].slice(0, MAX_STORED_SESSIONS);
      return {
        ...state,
        sessions,
        rewards: { ...state.rewards, dailyStreak: streak, lastSessionDay: day },
      };
    }

    case "RESET_PROGRESS":
      return {
        ...state,
        progress: {},
        sessions: [],
        rewards: { stars: 0, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [], dailyStreak: 0, lastSessionDay: undefined },
      };

    default:
      return state;
  }
}
