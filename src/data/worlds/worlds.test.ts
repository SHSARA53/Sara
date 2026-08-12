import { describe, expect, it } from "vitest";
import { worlds, orderedWorlds, getWorld, getWorldByTopicId } from "./worlds";
import { getTopic } from "../topics/topics";
import { stickers, stickersForWorld } from "../stickers";
import { stories, storiesForWorld } from "../stories/stories";

describe("worlds data integrity", () => {
  it("every world points at a real, existing topic", () => {
    for (const world of worlds) {
      expect(getTopic(world.topicId), `world "${world.id}" references missing topic "${world.topicId}"`).toBeDefined();
    }
  });

  it("has unique world ids and unique order values", () => {
    const ids = worlds.map((w) => w.id);
    const orders = worlds.map((w) => w.order);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("orderedWorlds is sorted ascending by order", () => {
    const orders = orderedWorlds.map((w) => w.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("getWorld/getWorldByTopicId resolve correctly and return undefined for unknown ids", () => {
    expect(getWorld("rainbow-garden")?.topicId).toBe("colors");
    expect(getWorldByTopicId("colors")?.id).toBe("rainbow-garden");
    expect(getWorld("not-a-world")).toBeUndefined();
    expect(getWorldByTopicId("not-a-topic")).toBeUndefined();
  });

  it("every world has a positive exploration target and at least one skill listed for parents", () => {
    for (const world of worlds) {
      expect(world.explorationTarget).toBeGreaterThan(0);
      expect(world.skills.length).toBeGreaterThan(0);
    }
  });
});

describe("stickers data integrity", () => {
  it("every sticker belongs to a real world", () => {
    for (const sticker of stickers) {
      expect(getWorld(sticker.worldId), `sticker "${sticker.id}" references missing world "${sticker.worldId}"`).toBeDefined();
    }
  });

  it("every world has at least one collectible sticker", () => {
    for (const world of worlds) {
      expect(stickersForWorld(world.id).length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate sticker ids", () => {
    const ids = stickers.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("stories data integrity", () => {
  it("every story belongs to a real world and its activity scenes reference real topics", () => {
    for (const story of stories) {
      expect(getWorld(story.worldId)).toBeDefined();
      for (const scene of story.scenes) {
        if (scene.kind === "activity") {
          expect(getTopic(scene.activityTopicId!)).toBeDefined();
        }
      }
    }
  });

  it("storiesForWorld only returns stories for that world", () => {
    const rainbowStories = storiesForWorld("rainbow-garden");
    expect(rainbowStories.every((s) => s.worldId === "rainbow-garden")).toBe(true);
    expect(rainbowStories.length).toBeGreaterThan(0);
  });
});
