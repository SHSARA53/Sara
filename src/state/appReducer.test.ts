import { describe, expect, it } from "vitest";
import { appReducer } from "./appReducer";
import { createDefaultState } from "../services/storage/defaults";
import type { LearningSession } from "../models/types";

describe("appReducer RECORD_ANSWER", () => {
  it("creates topic progress on the first answer and updates mastery for that vocab item", () => {
    const state = appReducer(createDefaultState(), { type: "RECORD_ANSWER", topicId: "colors", vocabId: "red", correct: true });
    expect(state.progress.colors).toBeDefined();
    expect(state.progress.colors.masteryByVocab.red.totalAttempts).toBe(1);
    expect(state.progress.colors.activitiesCompleted).toBe(1);
  });

  it("accumulates across multiple answers for different vocab items in the same topic", () => {
    let state = createDefaultState();
    state = appReducer(state, { type: "RECORD_ANSWER", topicId: "colors", vocabId: "red", correct: true });
    state = appReducer(state, { type: "RECORD_ANSWER", topicId: "colors", vocabId: "blue", correct: false });
    expect(state.progress.colors.activitiesCompleted).toBe(2);
    expect(Object.keys(state.progress.colors.masteryByVocab)).toEqual(["red", "blue"]);
  });
});

describe("appReducer ADD_REWARDS", () => {
  it("sums reward counters and only adds sticker ids not already owned", () => {
    let state = createDefaultState();
    state = appReducer(state, { type: "ADD_REWARDS", bundle: { stars: 1, hearts: 0, rainbows: 1, balloons: 1, stickerIds: ["sticker-dog"] } });
    state = appReducer(state, { type: "ADD_REWARDS", bundle: { stars: 2, hearts: 1, rainbows: 0, balloons: 0, stickerIds: ["sticker-dog", "sticker-cat"] } });
    expect(state.rewards.stars).toBe(3);
    expect(state.rewards.stickerIds).toEqual(["sticker-dog", "sticker-cat"]);
  });
});

describe("appReducer ADD_SESSION", () => {
  it("advances the daily streak and prepends the session to history", () => {
    const session: LearningSession = {
      id: "s1",
      topicIds: ["colors"],
      activities: [],
      currentIndex: 0,
      startedAt: new Date("2026-08-11T09:00:00Z").getTime(),
      completedAt: new Date("2026-08-11T09:08:00Z").getTime(),
      results: [],
      rewardsEarned: { stars: 0, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [] },
    };
    let state = createDefaultState();
    state.rewards.dailyStreak = 2;
    state.rewards.lastSessionDay = "2026-08-10";
    state = appReducer(state, { type: "ADD_SESSION", session });
    expect(state.sessions[0].id).toBe("s1");
    expect(state.rewards.dailyStreak).toBe(3);
  });
});

describe("appReducer RESET_PROGRESS", () => {
  it("clears progress, sessions and rewards but keeps the profile and settings", () => {
    let state = createDefaultState();
    state = appReducer(state, { type: "SET_PROFILE", profile: { id: "c1", name: "Noa", ageYears: 2, language: "he", avatar: "🐰", createdAt: 1 } });
    state = appReducer(state, { type: "RECORD_ANSWER", topicId: "colors", vocabId: "red", correct: true });
    state = appReducer(state, { type: "ADD_REWARDS", bundle: { stars: 5, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [] } });

    state = appReducer(state, { type: "RESET_PROGRESS" });

    expect(state.progress).toEqual({});
    expect(state.sessions).toEqual([]);
    expect(state.rewards.stars).toBe(0);
    expect(state.profile?.name).toBe("Noa");
  });
});
