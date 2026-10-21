import { calendarDate, isCalendarDate, localDate } from "../records/validation";
export function shiftDay(date: string, days: number): string {
  if (!isCalendarDate(date) || !Number.isInteger(days))
    throw new Error("Invalid calendar date.");
  const value = calendarDate(date);
  value.setDate(value.getDate() + days);
  return localDate(value);
}
/** Navigation input is untrusted, including repeated query parameters. */
export function resolveAddDate(value: unknown, today: string): string | null {
  if (value === undefined) return today;
  return typeof value === "string" && isCalendarDate(value) && value <= today
    ? value
    : null;
}
