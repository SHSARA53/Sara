/** Just a simple "day N" counter for the Today's Adventure card - actual topic/skill selection lives in dailyAdventureEngine.ts. */
export function getAdventureDayLabel(profileCreatedAt: number, now: number = Date.now()): number {
  return Math.max(1, Math.floor((now - profileCreatedAt) / (1000 * 60 * 60 * 24)) + 1);
}
