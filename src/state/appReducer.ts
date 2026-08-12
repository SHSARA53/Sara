import type {
  AppSettings,
  AppState,
  ChildProfile,
  InProgressSession,
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
  | { type: "RECORD_ACTIVITY_COMPLETE"; topicId: string }
  | { type: "ADD_REWARDS"; bundle: RewardBundle }
  | { type: "ADD_SESSION"; session: LearningSession }
  | { type: "SET_IN_PROGRESS_SESSION"; value: InProgressSession | null }
  | { type: "CELEBRATE_WORLD"; worldId: string }
  | { type: "CELEBRATE_FIRST_ACTIVITY" }
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
        lastPracticedAt: now,
      };

      return {
        ...state,
        progress: { ...state.progress, [action.topicId]: nextProgress },
      };
    }

    // Separate from RECORD_ANSWER on purpose: a single MATCH/MEMORY/SORT
    // activity touches several vocab items at once (several RECORD_ANSWER
    // calls) but should only count as *one* explored activity - otherwise a
    // 4-pair memory game would inflate "activities explored" by 4.
    case "RECORD_ACTIVITY_COMPLETE": {
      const existing = state.progress[action.topicId] ?? createEmptyTopicProgress(action.topicId);
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.topicId]: { ...existing, activitiesCompleted: existing.activitiesCompleted + 1 },
        },
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
      // Base the streak on when the session actually happened, not on
      // whenever this reducer call happens to run - keeps it correct
      // around midnight and makes it independently testable.
      const sessionDate = new Date(action.session.completedAt ?? action.session.startedAt);
      const { streak, day } = updateStreak(state.rewards.dailyStreak, state.rewards.lastSessionDay, sessionDate);
      const sessions = [action.session, ...state.sessions].slice(0, MAX_STORED_SESSIONS);
      return {
        ...state,
        sessions,
        rewards: { ...state.rewards, dailyStreak: streak, lastSessionDay: day },
      };
    }

    case "SET_IN_PROGRESS_SESSION":
      return { ...state, inProgressSession: action.value };

    case "CELEBRATE_WORLD":
      if (state.rewards.celebratedWorldIds.includes(action.worldId)) return state;
      return {
        ...state,
        rewards: { ...state.rewards, celebratedWorldIds: [...state.rewards.celebratedWorldIds, action.worldId] },
      };

    case "CELEBRATE_FIRST_ACTIVITY":
      if (state.rewards.hasCelebratedFirstActivity) return state;
      return { ...state, rewards: { ...state.rewards, hasCelebratedFirstActivity: true } };

    case "RESET_PROGRESS":
      return {
        ...state,
        progress: {},
        sessions: [],
        inProgressSession: null,
        rewards: {
          stars: 0,
          hearts: 0,
          rainbows: 0,
          balloons: 0,
          stickerIds: [],
          dailyStreak: 0,
          lastSessionDay: undefined,
          celebratedWorldIds: [],
          hasCelebratedFirstActivity: false,
        },
      };

    default:
      return state;
  }
}
