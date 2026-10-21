import type { GoalValues, Metric } from "../models/HealthGoals";
import { measurementLimits } from "../records/validation";
export const goalMetrics: Metric[] = ["steps", "calories", "water"];
export type GoalFields = Record<Metric, string>;
export type GoalErrors = Partial<Record<Metric, string>>;
export function validateGoals(input: GoalValues): void {
  for (const key of goalMetrics) {
    const value = input[key];
    if (
      value !== null &&
      (!Number.isSafeInteger(value) ||
        typeof value !== "number" ||
        value < 1 ||
        value > measurementLimits[key])
    )
      throw new Error(
        "Goals must be positive whole numbers within the displayed limits, or unset.",
      );
  }
}
export function validateGoalFields(fields: GoalFields): {
  errors: GoalErrors;
  input?: GoalValues;
} {
  const errors: GoalErrors = {},
    input = {} as GoalValues;
  for (const key of goalMetrics) {
    const text = fields[key].trim();
    input[key] = text ? Number(text) : null;
    if (
      text &&
      (!/^\d+$/.test(text) ||
        !Number.isSafeInteger(input[key]) ||
        input[key]! < 1 ||
        input[key]! > measurementLimits[key])
    )
      errors[key] =
        `Enter a whole number from 1 to ${measurementLimits[key].toLocaleString()}, or leave blank.`;
  }
  return Object.keys(errors).length ? { errors } : { errors, input };
}
