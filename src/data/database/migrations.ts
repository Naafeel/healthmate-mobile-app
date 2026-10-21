import type { DatabaseConnection } from "./connection";
import { createHealthGoalsSQL } from "./goalsMigration";
export const schemaVersion = 2;
export const createHealthRecordsSQL = `CREATE TABLE IF NOT EXISTS health_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE CHECK (
    length(date) = 10 AND date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    AND CAST(substr(date,1,4) AS INTEGER) BETWEEN 1 AND 9999
    AND CAST(substr(date,6,2) AS INTEGER) BETWEEN 1 AND 12
    AND CAST(substr(date,9,2) AS INTEGER) BETWEEN 1 AND CASE
      WHEN CAST(substr(date,6,2) AS INTEGER) IN (4,6,9,11) THEN 30
      WHEN CAST(substr(date,6,2) AS INTEGER) = 2 THEN CASE
        WHEN CAST(substr(date,1,4) AS INTEGER) % 4 = 0 AND
          (CAST(substr(date,1,4) AS INTEGER) % 100 != 0 OR CAST(substr(date,1,4) AS INTEGER) % 400 = 0) THEN 29 ELSE 28 END
      ELSE 31 END
  ),
  steps INTEGER NOT NULL CHECK (typeof(steps) = 'integer' AND steps BETWEEN 0 AND 200000),
  calories INTEGER NOT NULL CHECK (typeof(calories) = 'integer' AND calories BETWEEN 0 AND 20000),
  water INTEGER NOT NULL CHECK (typeof(water) = 'integer' AND water BETWEEN 0 AND 20000)
);`;
/** Run once per connection before publishing it. Transactional version changes never wipe data. */
export async function migrateDatabase(db: DatabaseConnection): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  await db.execAsync("BEGIN IMMEDIATE;");
  try {
    const version =
      (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version;"))
        ?.user_version ?? 0;
    if (version > schemaVersion)
      throw new Error("This database needs a newer HealthMate version.");
    if (version < 1) {
      await db.execAsync(createHealthRecordsSQL);
      await db.execAsync("PRAGMA user_version = 1;");
    }
    if (version < 2) {
      await db.execAsync(createHealthGoalsSQL);
      await db.execAsync("PRAGMA user_version = 2;");
    }
    await db.execAsync("COMMIT;");
  } catch (error) {
    await db.execAsync("ROLLBACK;");
    throw error;
  }
}
