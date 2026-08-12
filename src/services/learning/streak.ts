function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Gentle streak counter: consecutive days extend it, a gap simply restarts
 * at 1 (today still counts) - the app never tells the child they "lost"
 * anything, per the no-punishment requirement.
 */
export function updateStreak(
  previousStreak: number,
  lastSessionDay: string | undefined,
  now: Date = new Date(),
): { streak: number; day: string } {
  const today = toDayString(now);
  if (lastSessionDay === today) {
    return { streak: previousStreak, day: today };
  }

  const yesterday = toDayString(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const isConsecutive = lastSessionDay === yesterday;

  return { streak: isConsecutive ? previousStreak + 1 : 1, day: today };
}

/**
 * True once there's been more than a one-day gap since the last session -
 * the cue for a warm "I missed you!" welcome instead of the usual greeting.
 * Never used to say anything like "you missed N days."
 */
export function isReturningAfterGap(lastSessionDay: string | undefined, now: Date = new Date()): boolean {
  if (!lastSessionDay) return false;
  const today = toDayString(now);
  const yesterday = toDayString(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  return lastSessionDay !== today && lastSessionDay !== yesterday;
}
