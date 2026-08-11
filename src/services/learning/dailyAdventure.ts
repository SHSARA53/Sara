/**
 * "Today's Adventure": a rotating 7-day plan so the child gets repetition
 * instead of a brand-new topic every day, per the toddler learning guidance.
 */
const WEEKLY_ROTATION: string[][] = [
  ["colors"],
  ["animals"],
  ["numbers"],
  ["shapes"],
  ["animals", "games"],
  ["colors", "games"],
  ["colors", "animals", "numbers", "shapes"], // review day
];

export function getTodaysAdventureTopics(profileCreatedAt: number, now: number = Date.now()): string[] {
  const daysSince = Math.floor((now - profileCreatedAt) / (1000 * 60 * 60 * 24));
  const index = ((daysSince % WEEKLY_ROTATION.length) + WEEKLY_ROTATION.length) % WEEKLY_ROTATION.length;
  return WEEKLY_ROTATION[index];
}

export function getAdventureDayLabel(profileCreatedAt: number, now: number = Date.now()): number {
  return Math.max(1, Math.floor((now - profileCreatedAt) / (1000 * 60 * 60 * 24)) + 1);
}
