import type { CreateHealthRecord } from "../models/HealthRecord";
import { RecordError } from "./recordErrors";
export type RecordFields = {
  date: string;
  steps: string;
  calories: string;
  water: string;
};
export type FieldErrors = Partial<Record<keyof RecordFields, string>>;
/** Local calendar date, deliberately avoiding UTC toISOString(). */
export function localDate(date = new Date()): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}
export function calendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const result = new Date();
  result.setFullYear(year, month - 1, day);
  result.setHours(12, 0, 0, 0);
  return result;
}
export const measurementLimits = {
  steps: 200000,
  calories: 20000,
  water: 20000,
} as const;
const labels = { steps: "Steps", calories: "Calories", water: "Water intake" };
export function validateRecordForm(
  fields: RecordFields,
  today = localDate(),
): { errors: FieldErrors; input?: CreateHealthRecord } {
  const errors: FieldErrors = {};
  if (!fields.date) errors.date = "Choose a date.";
  else if (!isCalendarDate(fields.date))
    errors.date = "Choose a valid calendar date.";
  else if (fields.date > today)
    errors.date = "Completed activity cannot be recorded for a future date.";
  const numbers = {} as Record<"steps" | "calories" | "water", number>;
  for (const field of ["steps", "calories", "water"] as const) {
    const text = fields[field].trim();
    const value = Number(text);
    if (!text) errors[field] = labels[field] + " is required. Enter 0 if none.";
    else if (!/^\d+$/.test(text) || !Number.isSafeInteger(value))
      errors[field] = labels[field] + " must be a non-negative whole number.";
    else if (value > measurementLimits[field])
      errors[field] =
        labels[field] +
        " must be " +
        measurementLimits[field].toLocaleString() +
        " or less.";
    numbers[field] = value;
  }
  return Object.keys(errors).length
    ? { errors }
    : { errors, input: { date: fields.date, ...numbers } };
}
export function validateRecordInput(input: CreateHealthRecord): void {
  for (const field of ["steps", "calories", "water"] as const) {
    if (typeof input[field] !== "number" || !Number.isSafeInteger(input[field]))
      throw new RecordError(
        "validation",
        "Measurements must be safe whole numbers.",
      );
  }
  const result = validateRecordForm({
    date: input.date,
    steps: String(input.steps),
    calories: String(input.calories),
    water: String(input.water),
  });
  if (!result.input)
    throw new RecordError(
      "validation",
      Object.values(result.errors)[0] ?? "Check the record details.",
    );
}
export function validateId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new RecordError("validation", "The record ID is invalid.");
}
