import { describe, expect, it } from "vitest";
import { isQuietTime } from "./quietMode";

describe("isQuietTime", () => {
  it("is false when no window is configured", () => {
    expect(isQuietTime(undefined, undefined, new Date("2026-08-11T22:00:00"))).toBe(false);
  });

  it("handles a same-day window (e.g. nap time 13:00-15:00)", () => {
    expect(isQuietTime("13:00", "15:00", new Date("2026-08-11T14:00:00"))).toBe(true);
    expect(isQuietTime("13:00", "15:00", new Date("2026-08-11T16:00:00"))).toBe(false);
  });

  it("handles an overnight window (e.g. bedtime 19:00-07:00)", () => {
    expect(isQuietTime("19:00", "07:00", new Date("2026-08-11T22:00:00"))).toBe(true);
    expect(isQuietTime("19:00", "07:00", new Date("2026-08-11T03:00:00"))).toBe(true);
    expect(isQuietTime("19:00", "07:00", new Date("2026-08-11T12:00:00"))).toBe(false);
  });
});
