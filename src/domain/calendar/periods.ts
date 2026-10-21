import { calendarDate, isCalendarDate, localDate } from "../records/validation";
export type PeriodMode = "weekly" | "monthly";
export interface Period {
  start: string;
  end: string;
}
function checkDate(date: string) {
  if (!isCalendarDate(date)) throw new Error("Invalid calendar date.");
}
export function periodFor(date: string, mode: PeriodMode): Period {
  checkDate(date);
  const start = calendarDate(date),
    end = calendarDate(date);
  if (mode === "weekly") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
  } else {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
  }
  return { start: localDate(start), end: localDate(end) };
}
export function adjacentPeriod(
  period: Period,
  mode: PeriodMode,
  direction: -1 | 1,
  today: string,
): Period {
  const date = calendarDate(period.start);
  if (mode === "weekly") date.setDate(date.getDate() + direction * 7);
  else date.setMonth(date.getMonth() + direction, 1);
  const next = periodFor(localDate(date), mode);
  return next.start > periodFor(today, mode).start
    ? periodFor(today, mode)
    : next;
}
