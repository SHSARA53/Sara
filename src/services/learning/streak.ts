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
