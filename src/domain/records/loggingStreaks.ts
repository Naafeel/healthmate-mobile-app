import { isCalendarDate } from "./validation";
import { shiftDay } from "../calendar/dates";
/** Logging only: zeros count, goals/measurements are irrelevant. O(n log n), O(n) space. */
export function loggingStreaks(
  dates: readonly string[],
  today: string,
): { current: number; longest: number } {
  if (!isCalendarDate(today) || dates.some((date) => !isCalendarDate(date)))
    throw new Error("Invalid saved date.");
  const saved = new Set(dates.filter((date) => date <= today));
  const sorted = [...saved].sort();
  let longest = 0,
    run = 0,
    previous: string | undefined;
  for (const date of sorted) {
    run = previous && shiftDay(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  let date = saved.has(today) ? today : shiftDay(today, -1),
    current = 0;
  while (saved.has(date)) {
    current++;
    if (date === "0001-01-01") break;
    date = shiftDay(date, -1);
  }
  return { current, longest };
}
