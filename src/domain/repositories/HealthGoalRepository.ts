import type { GoalValues, HealthGoals } from "../models/HealthGoals";
export interface HealthGoalRepository {
  getGoals(): Promise<HealthGoals>;
  /** Complete replacement: null explicitly clears an individual goal. */
  saveGoals(input: GoalValues): Promise<HealthGoals>;
}
