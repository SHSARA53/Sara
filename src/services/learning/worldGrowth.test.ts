import { describe, expect, it } from "vitest";
import { decorationCountForTier, growthTier } from "./worldGrowth";

describe("growthTier", () => {
  it("starts at seed with no progress", () => {
    expect(growthTier(0, 10)).toBe("seed");
  });

  it("moves through sprouting and blooming as the ratio increases", () => {
    expect(growthTier(3, 10)).toBe("seed"); // 30%, below the 33% sprouting threshold
    expect(growthTier(4, 10)).toBe("sprouting"); // 40%
    expect(growthTier(7, 10)).toBe("blooming"); // 70%
  });

  it("reaches flourishing once the target is met or exceeded, and never goes further", () => {
    expect(growthTier(10, 10)).toBe("flourishing");
    expect(growthTier(25, 10)).toBe("flourishing");
  });

  it("never crashes on a zero target", () => {
    expect(growthTier(0, 0)).toBe("seed");
  });
});

describe("decorationCountForTier", () => {
  it("increases monotonically with tier", () => {
    const seed = decorationCountForTier("seed");
    const sprouting = decorationCountForTier("sprouting");
    const blooming = decorationCountForTier("blooming");
    const flourishing = decorationCountForTier("flourishing");
    expect(seed).toBeLessThan(sprouting);
    expect(sprouting).toBeLessThan(blooming);
    expect(blooming).toBeLessThan(flourishing);
  });
});
