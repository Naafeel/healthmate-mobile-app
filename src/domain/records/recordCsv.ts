import type { HealthRecord } from "../models/HealthRecord";
import { isCalendarDate, measurementLimits } from "./validation";
/** Quotes RFC-style delimiters and neutralizes potential spreadsheet formulas in future text columns. */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[\s]*[=+\-@\t\r]/.test(text))
    text = "'" + text;
  return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}
/** UTF-8 text (encoded by the file adapter), CRLF, no IDs or fabricated summary rows. */
export function recordsCsv(records: readonly HealthRecord[]): string | null {
  if (!records.length) return null;
  const dates = new Set<string>();
  for (const row of records) {
    if (!isCalendarDate(row.date) || dates.has(row.date))
      throw new Error("Invalid saved record date.");
    dates.add(row.date);
    for (const key of ["steps", "calories", "water"] as const)
      if (
        !Number.isSafeInteger(row[key]) ||
        row[key] < 0 ||
        row[key] > measurementLimits[key]
      )
        throw new Error("Invalid saved measurement.");
  }
  return (
    [
      "date,steps,calories_burned_kcal,water_ml",
      ...[...records]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((row) =>
          [row.date, row.steps, row.calories, row.water].map(csvCell).join(","),
        ),
    ].join("\r\n") + "\r\n"
  );
}
