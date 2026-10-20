import { openDatabaseAsync } from "expo-sqlite";
import type { DatabaseConnection } from "./connection";
import { migrateDatabase } from "./migrations";
let opening: Promise<DatabaseConnection> | undefined;
export function getDatabase(): Promise<DatabaseConnection> {
  if (!opening) {
    opening = (async () => {
      const db = await openDatabaseAsync("healthmate.db");
      try {
        await migrateDatabase(db);
        return db;
      } catch (error) {
        await db.closeAsync();
        throw error;
      }
    })().catch((error) => {
      opening = undefined;
      throw error;
    });
  }
  return opening;
}
