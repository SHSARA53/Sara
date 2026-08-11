import { describe, expect, it } from "vitest";
import { storage } from "./storageAdapter";
import { createDefaultState } from "./defaults";

describe("storage adapter (IndexedDB-backed)", () => {
  it("returns null before anything has been saved", async () => {
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });

  it("round-trips a full app state through save/load", async () => {
    const state = createDefaultState();
    state.profile = { id: "c1", name: "Noa", ageYears: 2, language: "he", avatar: "🐰", createdAt: 123 };
    state.rewards.stars = 7;

    await storage.save(state);
    const loaded = await storage.load();

    expect(loaded?.profile?.name).toBe("Noa");
    expect(loaded?.rewards.stars).toBe(7);
  });

  it("clear() removes the persisted state", async () => {
    await storage.save(createDefaultState());
    await storage.clear();
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });
});
