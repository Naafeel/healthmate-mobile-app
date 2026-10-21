import type { HealthRecord } from "../models/HealthRecord";
import { calendarDate, isCalendarDate } from "../records/validation";
import { shiftDay } from "./dates";
export type CalendarDay = {
  date: string;
  status: "recorded" | "missing" | "future";
  record: HealthRecord | null;
};
export function selectCalendarDay(
  records: readonly HealthRecord[],
  date: string,
  today: string,
): CalendarDay {
  if (!isCalendarDate(date) || !isCalendarDate(today))
    throw new Error("Invalid calendar date.");
  if (date > today) return { date, status: "future", record: null };
  const record = records.find((row) => row.date === date) ?? null;
  return { date, status: record ? "recorded" : "missing", record };
}
/** Null slots pad only the outside of the conventional Monday-first month grid. */
export function monthGrid(monthStart: string): (string | null)[][] {
  if (!isCalendarDate(monthStart) || !monthStart.endsWith("-01"))
    throw new Error("Invalid month.");
  const first = calendarDate(monthStart),
    month = first.getMonth();
  const cells: (string | null)[] = Array((first.getDay() + 6) % 7).fill(null);
  let date = monthStart;
  while (calendarDate(date).getMonth() === month) {
    cells.push(date);
    date = shiftDay(date, 1);
  }
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );
}
export function calendarRecordAction(day: CalendarDay) {
  if (day.status === "future") return null;
  return day.record
    ? {
        pathname: "/edit-record/[id]" as const,
        params: { id: String(day.record.id), returnTo: "calendar" },
      }
    : {
        pathname: "/add-record" as const,
        params: { date: day.date, returnTo: "calendar" },
      };
}
