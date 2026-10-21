import type { DatabaseConnection } from "./connection";
import { initializeDatabase as initializeV3 } from "./preferencesMigration";
export const expandedSchemaVersion = 4;
export async function initializeExpandedDatabase(db: DatabaseConnection) {
  await db.execAsync(
    "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
  );
  const version =
    (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))
      ?.user_version ?? 0;
  if (version > 4)
    throw new Error("This database needs a newer HealthMate version.");
  if (version < 4) {
    await initializeV3(db);
    await db.execAsync("BEGIN IMMEDIATE");
    try {
      await db.execAsync(`CREATE TABLE record_annotations(record_id INTEGER PRIMARY KEY REFERENCES health_records(id) ON DELETE CASCADE,note TEXT NOT NULL DEFAULT '' CHECK(length(note)<=500));
 CREATE TABLE record_tags(record_id INTEGER NOT NULL REFERENCES health_records(id) ON DELETE CASCADE,tag TEXT NOT NULL CHECK(tag IN ('Walking','Running','Cycling','Gym','Yoga','Sports','Other')),PRIMARY KEY(record_id,tag));
 CREATE TABLE personal_profile(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);
 CREATE TABLE dashboard_layout(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);
 PRAGMA user_version=4; COMMIT;`);
    } catch (e) {
      await db.execAsync("ROLLBACK");
      throw e;
    }
  }
}
