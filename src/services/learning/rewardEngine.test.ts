import { describe, expect, it } from "vitest";
import { emptyRewardBundle, mergeRewardBundles, rewardForActivityResult, rewardForSessionCompletion } from "./rewardEngine";
import { stickers } from "../../data/stickers";
import type { ActivityResult } from "../../models/types";

const baseResult: ActivityResult = {
  activityId: "a1",
  topicId: "colors",
  vocabId: "red",
  correct: true,
  attempts: 1,
  hintsUsed: 0,
  responseTimeMs: 1200,
  timestamp: 0,
  graded: true,
};

describe("rewardForActivityResult", () => {
  it("awards a star for a clean first-try correct answer", () => {
    const bundle = rewardForActivityResult(baseResult);
    expect(bundle.stars).toBe(1);
    expect(bundle.hearts).toBe(0);
  });

  it("awards a heart (not a star) when hints were needed", () => {
    const bundle = rewardForActivityResult({ ...baseResult, hintsUsed: 1, attempts: 2 });
    expect(bundle.stars).toBe(0);
    expect(bundle.hearts).toBe(1);
  });

  it("never awards anything negative for a wrong/revealed answer", () => {
    const bundle = rewardForActivityResult({ ...baseResult, correct: false });
    expect(bundle.stars).toBe(0);
    expect(bundle.hearts).toBe(0);
    expect(bundle.rainbows).toBe(0);
    expect(bundle.balloons).toBe(0);
  });
});

describe("rewardForSessionCompletion", () => {
  it("always grants a rainbow and a balloon", () => {
    const bundle = rewardForSessionCompletion([]);
    expect(bundle.rainbows).toBe(1);
    expect(bundle.balloons).toBe(1);
  });

  it("prefers a sticker the child does not already own", () => {
    const alreadyOwned = stickers.slice(0, stickers.length - 1).map((s) => s.id);
    const bundle = rewardForSessionCompletion(alreadyOwned);
    expect(bundle.stickerIds).toHaveLength(1);
    expect(alreadyOwned).not.toContain(bundle.stickerIds[0]);
  });

  it("still grants a sticker even once the whole collection is owned", () => {
    const allOwned = stickers.map((s) => s.id);
    const bundle = rewardForSessionCompletion(allOwned);
    expect(bundle.stickerIds).toHaveLength(1);
  });
});

describe("mergeRewardBundles", () => {
  it("sums every counter and concatenates sticker ids", () => {
    const a = { stars: 1, hearts: 2, rainbows: 0, balloons: 1, stickerIds: ["x"] };
    const b = { stars: 3, hearts: 0, rainbows: 1, balloons: 0, stickerIds: ["y"] };
    const merged = mergeRewardBundles(a, b);
    expect(merged).toEqual({ stars: 4, hearts: 2, rainbows: 1, balloons: 1, stickerIds: ["x", "y"] });
  });

  it("empty bundle is the identity element", () => {
    const a = { stars: 2, hearts: 1, rainbows: 1, balloons: 1, stickerIds: ["z"] };
    expect(mergeRewardBundles(a, emptyRewardBundle())).toEqual(a);
  });
});
