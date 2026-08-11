import { describe, expect, it } from "vitest";
import { generateActivity } from "./activityGenerator";
import { colorsTopic, animalsTopic, foodTopic, numbersTopic, shapesTopic, gamesTopic, vehiclesTopic } from "../../data/topics/topics";
import { createRng } from "../../utils/rng";

describe("generateActivity FIND", () => {
  it.each([1, 2, 3] as const)("shows difficulty+1 choices for level %i", (difficulty) => {
    const activity = generateActivity(colorsTopic, "FIND", difficulty, { rng: createRng(1) });
    expect(activity.items).toHaveLength(difficulty + 1);
  });

  it("always includes the correct answer among the shown items", () => {
    for (let seed = 0; seed < 20; seed++) {
      const activity = generateActivity(colorsTopic, "FIND", 2, { rng: createRng(seed) });
      const ids = activity.items.map((item) => item.id);
      expect(ids).toContain(activity.correctIds[0]);
    }
  });

  it("never shows duplicate items", () => {
    const activity = generateActivity(animalsTopic, "FIND", 3, { rng: createRng(7) });
    const ids = activity.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("clamps choice count to the topic's vocabulary size", () => {
    const activity = generateActivity(shapesTopic, "FIND", 3, { rng: createRng(2) }); // shapes has 4 items, level3 wants 4
    expect(activity.items.length).toBeLessThanOrEqual(shapesTopic.vocabulary.length);
  });
});

describe("generateActivity COUNT", () => {
  it("shows exactly targetCount copies of the counted object", () => {
    const activity = generateActivity(foodTopic, "COUNT", 2, { rng: createRng(3) });
    expect(activity.targetCount).toBeGreaterThanOrEqual(1);
    expect(activity.targetCount).toBeLessThanOrEqual(5);
    expect(activity.countObject).toBeDefined();
  });

  it("the correct choice's numeric value matches targetCount", () => {
    const activity = generateActivity(numbersTopic, "COUNT", 1, { rng: createRng(5) });
    const correctItem = activity.items.find((item) => item.id === activity.correctIds[0]);
    expect(correctItem?.value).toBe(activity.targetCount);
  });
});

describe("generateActivity MATCH", () => {
  it("produces a right-hand tile for every left-hand item, linked via pairs", () => {
    const activity = generateActivity(animalsTopic, "MATCH", 2, { rng: createRng(9) });
    expect(activity.matchRightItems).toBeDefined();
    expect(activity.matchRightItems).toHaveLength(activity.items.length);
    for (const item of activity.items) {
      const rightId = activity.pairs?.[item.id];
      expect(rightId).toBeDefined();
      expect(activity.matchRightItems!.some((r) => r.id === rightId)).toBe(true);
    }
  });
});

describe("generateActivity MEMORY", () => {
  it("creates exactly two cards per pair", () => {
    const activity = generateActivity(animalsTopic, "MEMORY", 2, { rng: createRng(4) });
    const groups = activity.items.map((item) => item.group);
    const counts = new Map<string, number>();
    for (const g of groups) counts.set(g!, (counts.get(g!) ?? 0) + 1);
    for (const count of counts.values()) expect(count).toBe(2);
  });
});

describe("generateActivity SORT", () => {
  it("creates exactly two buckets and assigns every item to one of them", () => {
    const activity = generateActivity(foodTopic, "SORT", 2, { rng: createRng(6) });
    expect(activity.buckets).toHaveLength(2);
    const bucketIds = activity.buckets!.map((b) => b.id);
    for (const item of activity.items) {
      expect(bucketIds).toContain(item.group);
    }
  });

  it("gives colors a real sorting task (warm/cool groups with more than one item each), not one item per bucket", () => {
    for (let seed = 0; seed < 15; seed++) {
      const activity = generateActivity(colorsTopic, "SORT", 2, { rng: createRng(seed) });
      expect(activity.items.length).toBeGreaterThan(2);
    }
  });

  it("never leaks a raw internal key (hex color, group id) as a bucket label", () => {
    for (const topic of [colorsTopic, foodTopic, animalsTopic, vehiclesTopic]) {
      for (let seed = 0; seed < 10; seed++) {
        const activity = generateActivity(topic, "SORT", 2, { rng: createRng(seed) });
        for (const bucket of activity.buckets!) {
          expect(bucket.label.he).not.toMatch(/^#[0-9A-Fa-f]{3,6}$/);
          expect(bucket.label.en).not.toMatch(/^#[0-9A-Fa-f]{3,6}$/);
          expect(bucket.label.he.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never produces an empty SORT for a mixed topic with no vocabulary of its own (the 'games' topic)", () => {
    for (let seed = 0; seed < 10; seed++) {
      const activity = generateActivity(gamesTopic, "SORT", 2, { rng: createRng(seed) });
      expect(activity.items.length).toBeGreaterThan(0);
      expect(activity.buckets).toHaveLength(2);
      expect(activity.buckets![0].id).not.toBe(activity.buckets![1].id);
    }
  });
});

describe("generateActivity MATCH on a mixed topic (no vocabulary of its own)", () => {
  it("draws from every other topic instead of generating an empty match", () => {
    for (let seed = 0; seed < 10; seed++) {
      const activity = generateActivity(gamesTopic, "MATCH", 2, { rng: createRng(seed) });
      expect(activity.items.length).toBeGreaterThan(0);
      expect(activity.matchRightItems!.length).toBe(activity.items.length);
    }
  });
});

describe("generateActivity MEMORY on a mixed topic (no vocabulary of its own)", () => {
  it("draws from every other topic instead of generating an empty memory game", () => {
    const activity = generateActivity(gamesTopic, "MEMORY", 2, { rng: createRng(1) });
    expect(activity.items.length).toBeGreaterThan(0);
  });
});
