import type { HealthRecord } from "../../domain/models/HealthRecord";
import type { HealthRecordState } from "../../store/createHealthRecordStore";
import { calendarDate } from "../../domain/records/validation";
export type TodayAction =
  | { kind: "add"; label: "Add Today's Record" }
  | { kind: "edit"; label: "Edit Today's Record"; id: number };
export type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      today: HealthRecord | null;
      recent: HealthRecord[];
      action: TodayAction;
      refreshing: boolean;
      busy: boolean;
    };
/** Derive one daily row, never sum its measurements. Do not mutate canonical state. */
export function selectDashboard(
  state: Pick<
    HealthRecordState,
    "records" | "hasLoaded" | "loading" | "mutating" | "error"
  >,
  today: string,
): DashboardState {
  if (state.error) return { status: "error", message: state.error };
  if (!state.hasLoaded) return { status: "loading" };
  const record = state.records.find((item) => item.date === today) ?? null;
  return {
    status: "ready",
    today: record,
    recent: [...state.records]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3),
    action: record
      ? { kind: "edit", label: "Edit Today's Record", id: record.id }
      : { kind: "add", label: "Add Today's Record" },
    refreshing: state.loading,
    busy: state.loading || state.mutating,
  };
}
export function formatMeasurement(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    value,
  );
}
export function formatDashboardDate(date: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(calendarDate(date));
}
export function formatRecentDate(
  date: string,
  today: string,
  locale?: string,
): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(calendarDate(date));
  return date === today ? "Today · " + formatted : formatted;
}
