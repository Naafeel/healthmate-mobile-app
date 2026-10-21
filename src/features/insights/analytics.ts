import type { HealthRecord } from "../../domain/models/HealthRecord";
import type { Metric } from "../../domain/models/HealthGoals";
import {
  calendarDate,
  isCalendarDate,
  localDate,
  measurementLimits,
} from "../../domain/records/validation";
import type { Period } from "../../domain/calendar/periods";
export { periodFor, adjacentPeriod } from "../../domain/calendar/periods";
export type { PeriodMode, Period } from "../../domain/calendar/periods";
function checkDate(date: string) {
  if (!isCalendarDate(date)) throw new Error("Invalid calendar date.");
}
export type ChartDay = { date: string } & (
  | { status: "recorded"; value: number }
  | { status: "missing" | "future"; value: null }
);
export interface Analytics {
  days: ChartDay[];
  count: number;
  total: number | null;
  average: number | null;
  highest: { date: string; value: number } | null;
}
/** Only recorded days contribute. Earliest date wins highest ties. No historical goals. */
export function calculateAnalytics(
  records: readonly HealthRecord[],
  metric: Metric,
  period: Period,
  today: string,
): Analytics {
  checkDate(today);
  checkDate(period.start);
  checkDate(period.end);
  if (period.start > period.end || !Object.hasOwn(measurementLimits, metric))
    throw new Error("Invalid analytics selection.");
  const byDate = new Map<string, HealthRecord>();
  for (const record of records) {
    if (!isCalendarDate(record.date))
      throw new Error("Invalid saved activity date.");
    if (
      record.date < period.start ||
      record.date > period.end ||
      record.date > today
    )
      continue;
    if (
      byDate.has(record.date) ||
      !Number.isSafeInteger(record[metric]) ||
      record[metric] < 0 ||
      record[metric] > measurementLimits[metric]
    )
      throw new Error("Invalid saved activity value.");
    byDate.set(record.date, record);
  }
  const days: ChartDay[] = [];
  const cursor = calendarDate(period.start);
  while (localDate(cursor) <= period.end) {
    const date = localDate(cursor),
      record = byDate.get(date);
    days.push(
      date > today
        ? { date, status: "future", value: null }
        : record
          ? { date, status: "recorded", value: record[metric] }
          : { date, status: "missing", value: null },
    );
    cursor.setDate(cursor.getDate() + 1);
    if (days.length > 31) throw new Error("Period must be at most one month.");
  }
  let count = 0,
    total = 0;
  let highest: Analytics["highest"] = null;
  for (const day of days)
    if (day.status === "recorded") {
      count++;
      total += day.value;
      if (!highest || day.value > highest.value)
        highest = { date: day.date, value: day.value };
    }
  return {
    days,
    count,
    total: count ? total : null,
    average: count ? total / count : null,
    highest,
  };
}
export function analyticsState(
  records: readonly HealthRecord[],
  metric: Metric,
  period: Period,
  today: string,
  hasLoaded: boolean,
  error: string | null,
):
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: Analytics } {
  if (error) return { status: "error", message: error };
  if (!hasLoaded) return { status: "loading" };
  try {
    return {
      status: "ready",
      data: calculateAnalytics(records, metric, period, today),
    };
  } catch {
    return {
      status: "error",
      message:
        "Activity data could not be interpreted. Reload your records and try again.",
    };
  }
}
export function formatAnalyticsNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(
    value,
  );
}
export function formatAnalyticsDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(calendarDate(date));
}
