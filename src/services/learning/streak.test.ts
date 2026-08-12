import { describe, expect, it } from "vitest";
import { updateStreak, isReturningAfterGap } from "./streak";

describe("updateStreak", () => {
  it("starts a new streak at 1 on the very first session", () => {
    const { streak, day } = updateStreak(0, undefined, new Date("2026-08-11T10:00:00Z"));
    expect(streak).toBe(1);
    expect(day).toBe("2026-08-11");
  });

  it("does not change the streak for a second session on the same day", () => {
    const { streak } = updateStreak(3, "2026-08-11", new Date("2026-08-11T18:00:00Z"));
    expect(streak).toBe(3);
  });

  it("extends the streak by one on a consecutive day", () => {
    const { streak } = updateStreak(3, "2026-08-10", new Date("2026-08-11T09:00:00Z"));
    expect(streak).toBe(4);
  });

  it("gently restarts at 1 after a gap, never going negative or reporting a 'loss'", () => {
    const { streak } = updateStreak(5, "2026-08-01", new Date("2026-08-11T09:00:00Z"));
    expect(streak).toBe(1);
  });
});

describe("isReturningAfterGap", () => {
  it("is false for a brand new profile that has never played", () => {
    expect(isReturningAfterGap(undefined, new Date("2026-08-11T09:00:00Z"))).toBe(false);
  });

  it("is false for today or yesterday", () => {
    expect(isReturningAfterGap("2026-08-11", new Date("2026-08-11T09:00:00Z"))).toBe(false);
    expect(isReturningAfterGap("2026-08-10", new Date("2026-08-11T09:00:00Z"))).toBe(false);
  });

  it("is true after more than a one-day gap - the cue for a warm 'missed you' greeting", () => {
    expect(isReturningAfterGap("2026-08-01", new Date("2026-08-11T09:00:00Z"))).toBe(true);
  });
});
