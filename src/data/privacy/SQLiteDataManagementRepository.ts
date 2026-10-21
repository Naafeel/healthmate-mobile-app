import type { DatabaseConnection } from "../database/connection";
export class SQLiteDataManagementRepository {
  constructor(private database: () => Promise<DatabaseConnection>) {}
  async clear(all: boolean) {
    const db = await this.database();
    await db.execAsync("BEGIN IMMEDIATE");
    try {
      await db.runAsync("DELETE FROM health_records");
      if (all)
        for (const table of [
          "health_goals",
          "personal_profile",
          "dashboard_layout",
          "app_preferences",
        ])
          await db.runAsync(`DELETE FROM ${table}`);
      await db.execAsync("COMMIT");
    } catch (e) {
      await db.execAsync("ROLLBACK");
      throw e;
    }
  }
}
