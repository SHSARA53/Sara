import type { AppSettings, AppState, RewardState } from "../../models/types";
import { topics } from "../../data/topics/topics";

export function createDefaultSettings(): AppSettings {
  return {
    language: "he",
    soundEnabled: true,
    voiceEnabled: true,
    volume: 0.8,
    reducedMotion: false,
    enabledTopicIds: topics.map((topic) => topic.id),
    difficulty: "normal",
  };
}

export function createDefaultRewards(): RewardState {
  return {
    stars: 0,
    hearts: 0,
    rainbows: 0,
    balloons: 0,
    stickerIds: [],
    dailyStreak: 0,
  };
}

export function createDefaultState(): AppState {
  return {
    profile: null,
    settings: createDefaultSettings(),
    rewards: createDefaultRewards(),
    progress: {},
    sessions: [],
    onboardingComplete: false,
  };
}
