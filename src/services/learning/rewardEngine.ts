import type { ActivityResult, RewardBundle } from "../../models/types";
import { stickers, stickersForWorld } from "../../data/stickers";
import { pick } from "../../utils/rng";

export function emptyRewardBundle(): RewardBundle {
  return { stars: 0, hearts: 0, rainbows: 0, balloons: 0, stickerIds: [] };
}

/** Rewards for a single answered activity. Correct answers always earn something - never a penalty. */
export function rewardForActivityResult(result: ActivityResult): RewardBundle {
  const bundle = emptyRewardBundle();
  if (result.correct) {
    if (result.hintsUsed === 0 && result.attempts === 1) {
      bundle.stars = 1;
    } else {
      bundle.hearts = 1; // still celebrated, just a softer reward for a harder path
    }
  }
  return bundle;
}

/**
 * Rewards for finishing a full session, including a new sticker when
 * available. The sticker is a meaningful, predetermined pick tied to the
 * world just explored (not a random gacha-style draw across the whole
 * collection) - completing a Rainbow Garden session finds a Rainbow Garden
 * sticker, so the treasure chest always makes sense with what was just
 * played. Falls back to any unowned sticker, then any sticker at all once
 * the whole collection is complete.
 */
export function rewardForSessionCompletion(ownedStickerIds: string[], worldId?: string): RewardBundle {
  const bundle = emptyRewardBundle();
  bundle.rainbows = 1;
  bundle.balloons = 1;

  const worldStickers = worldId ? stickersForWorld(worldId) : [];
  const unownedInWorld = worldStickers.filter((sticker) => !ownedStickerIds.includes(sticker.id));
  const unownedAnywhere = stickers.filter((sticker) => !ownedStickerIds.includes(sticker.id));

  const pool = unownedInWorld.length > 0 ? unownedInWorld : unownedAnywhere.length > 0 ? unownedAnywhere : stickers;
  const chosen = pick(pool, Math.random);
  bundle.stickerIds = [chosen.id];

  return bundle;
}

export function mergeRewardBundles(a: RewardBundle, b: RewardBundle): RewardBundle {
  return {
    stars: a.stars + b.stars,
    hearts: a.hearts + b.hearts,
    rainbows: a.rainbows + b.rainbows,
    balloons: a.balloons + b.balloons,
    stickerIds: [...a.stickerIds, ...b.stickerIds],
  };
}
