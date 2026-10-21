export type Metric = "steps" | "calories" | "water";
export type GoalValues = Record<Metric, number | null>;
export interface HealthGoals extends GoalValues {
  updatedAt: string | null;
}
export const emptyGoals: HealthGoals = {
  steps: null,
  calories: null,
  water: null,
  updatedAt: null,
};
