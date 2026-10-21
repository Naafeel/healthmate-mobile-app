import type { HealthRecord } from "../models/HealthRecord";
import { periodFor } from "../calendar/periods";
import { shiftDay } from "../calendar/dates";
import { isCalendarDate } from "../records/validation";
export function weeklySummary(
  records: readonly HealthRecord[],
  today: string,
  previous = false,
) {
  if (!isCalendarDate(today)) throw new Error("Invalid local date.");
  const current = periodFor(today, "weekly"),
    period = previous
      ? periodFor(shiftDay(current.start, -7), "weekly")
      : current;
  const end = period.end < today ? period.end : today;
  const rows = [
    ...new Map(
      records
        .filter((r) => r.date >= period.start && r.date <= end)
        .map((r) => [r.date, r]),
    ).values(),
  ];
  const metrics = (["steps", "calories", "water"] as const).map((k) => ({
    key: k,
    total: rows.reduce((sum, r) => sum + r[k], 0),
    average: rows.length
      ? rows.reduce((sum, r) => sum + r[k], 0) / rows.length
      : null,
  }));
  const labels = {
    steps: "Steps",
    calories: "Calories burned (kcal)",
    water: "Water intake (ml)",
  };
  const format = (n: number) =>
    new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);
  const text = [
    "HealthMate — Weekly Activity Summary",
    `Week: ${period.start} to ${period.end}`,
    previous
      ? "Completed Monday–Sunday week."
      : `Current week in progress: saved activity through ${end}.`,
    `Days recorded: ${rows.length}`,
    `Logging coverage: ${rows.length} of 7 calendar days`,
    ...metrics.flatMap((m) => [
      `${labels[m.key]} — total: ${rows.length ? format(m.total) : "Unavailable (no recorded days)"}`,
      `${labels[m.key]} — average per recorded day: ${m.average === null ? "Unavailable (no recorded days)" : format(m.average)}`,
    ]),
    "Missing dates are unrecorded; saved zeros count as recorded days.",
    "Self-reported activity, not medical advice.",
  ].join("\n");
  return { period, end, days: rows.length, metrics, text };
}
export async function shareSummary(
  text: string,
  share: (text: string) => Promise<"closed" | "cancelled">,
) {
  return (await share(text)) === "cancelled"
    ? "Sharing cancelled."
    : "Sharing closed. HealthMate cannot confirm delivery to a recipient.";
}
