export function isQuietTime(start: string | undefined, end: string | undefined, now: Date = new Date()): boolean {
  if (!start || !end) return false;
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // overnight window, e.g. 19:00 - 07:00
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}
