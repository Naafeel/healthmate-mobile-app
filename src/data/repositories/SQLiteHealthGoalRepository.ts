import type { GoalValues, HealthGoals } from "../../domain/models/HealthGoals";
import { emptyGoals } from "../../domain/models/HealthGoals";
import { validateGoals } from "../../domain/goals/validation";
import type { HealthGoalRepository } from "../../domain/repositories/HealthGoalRepository";
import type { DatabaseConnection } from "../database/connection";
export class SQLiteHealthGoalRepository implements HealthGoalRepository {
  constructor(
    private readonly database: () => Promise<DatabaseConnection>,
    private readonly now = () => new Date(),
  ) {}
  async getGoals(): Promise<HealthGoals> {
    try {
      const db = await this.database();
      const row = await db.getFirstAsync<HealthGoals>(
        "SELECT steps_goal AS steps, calories_goal AS calories, water_goal AS water, updated_at AS updatedAt FROM health_goals WHERE id = 1",
      );
      if (row) validateGoals(row);
      return row ?? { ...emptyGoals };
    } catch {
      throw new Error(
        "Goals could not be loaded from this device. Please retry.",
      );
    }
  }
  async saveGoals(input: GoalValues): Promise<HealthGoals> {
    validateGoals(input);
    try {
      const updatedAt = this.now().toISOString();
      const db = await this.database();
      await db.runAsync(
        "INSERT INTO health_goals(id, steps_goal, calories_goal, water_goal, updated_at) VALUES(1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET steps_goal=excluded.steps_goal, calories_goal=excluded.calories_goal, water_goal=excluded.water_goal, updated_at=excluded.updated_at",
        input.steps,
        input.calories,
        input.water,
        updatedAt,
      );
      return { ...input, updatedAt };
    } catch {
      throw new Error(
        "Goals could not be saved on this device. Your changes are still here; try saving again.",
      );
    }
  }
}
