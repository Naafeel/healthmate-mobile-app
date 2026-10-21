import type { DatabaseConnection } from "./connection";
import { migrateDatabase } from "./migrations";
export const currentSchemaVersion = 3;
export const preferencesSQL = `CREATE TABLE IF NOT EXISTS app_preferences (
 id INTEGER PRIMARY KEY CHECK(id=1),
 theme TEXT NOT NULL CHECK(theme IN ('light','dark','system')),
 reminder_enabled INTEGER NOT NULL CHECK(reminder_enabled IN (0,1)),
 reminder_hour INTEGER NOT NULL CHECK(typeof(reminder_hour)='integer' AND reminder_hour BETWEEN 0 AND 23),
 reminder_minute INTEGER NOT NULL CHECK(typeof(reminder_minute)='integer' AND reminder_minute BETWEEN 0 AND 59)
);`;
/** Preserve the original v1/v2 migrations verbatim; add v3 without seeding health data. */
export async function initializeDatabase(db: DatabaseConnection) {
  await db.execAsync("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
  const version =
    (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))
      ?.user_version ?? 0;
  if (version > currentSchemaVersion)
    throw new Error("This database needs a newer HealthMate version.");
  if (version <= 2) await migrateDatabase(db);
  if (version < 3) {
    await db.execAsync("BEGIN IMMEDIATE");
    try {
      await db.execAsync(preferencesSQL);
      await db.execAsync("PRAGMA user_version=3; COMMIT;");
    } catch (e) {
      await db.execAsync("ROLLBACK");
      throw e;
    }
  }
}
