import { SQLiteAnnotatedRecordRepository } from "../repositories/SQLiteAnnotatedRecordRepository";
import { SQLitePersonalizationRepository } from "../repositories/SQLitePersonalizationRepository";
import { emptyProfile } from "../../domain/profile/profile";
import { defaultLayout } from "../../domain/dashboard/layout";
import type { DatabaseConnection } from "../database/connection";
import { validateBackup, type HealthBackup } from "../../domain/backup/backup";
import type { CreateHealthRecord } from "../../domain/models/HealthRecord";
import { SQLiteHealthGoalRepository } from "../repositories/SQLiteHealthGoalRepository";
import {
  SQLitePreferencesRepository,
  writePreferences,
} from "../repositories/SQLitePreferencesRepository";
export class SQLiteBackupRepository {
  constructor(private readonly database: () => Promise<DatabaseConnection>) {}
  async snapshot(): Promise<HealthBackup> {
    const db = await this.database();
    await db.execAsync("BEGIN");
    try {
      const expanded =
        ((
          await db.getFirstAsync<{ user_version: number }>(
            "PRAGMA user_version",
          )
        )?.user_version ?? 0) >= 4;
      const records = expanded
        ? (
            await new SQLiteAnnotatedRecordRepository(
              async () => db,
            ).getAllRecords()
          ).map(({ id: _id, ...r }) => r)
        : await db.getAllAsync<CreateHealthRecord>(
            "SELECT date,steps,calories,water FROM health_records ORDER BY date",
          );
      const goals = await new SQLiteHealthGoalRepository(
        async () => db,
      ).getGoals();
      const preferences = await new SQLitePreferencesRepository(
        async () => db,
      ).get();
      const backup = validateBackup({
        format: "healthmate-backup",
        version: expanded ? 2 : 1,
        ...(expanded
          ? await new SQLitePersonalizationRepository(async () => db).get()
          : {}),
        exportedAt: new Date().toISOString(),
        records,
        goals: {
          steps: goals.steps,
          calories: goals.calories,
          water: goals.water,
        },
        preferences,
      });
      await db.execAsync("COMMIT");
      return backup;
    } catch (e) {
      await db.execAsync("ROLLBACK");
      throw e;
    }
  }
  async restore(input: unknown) {
    const b = validateBackup(input);
    const db = await this.database();
    await db.execAsync("BEGIN IMMEDIATE");
    try {
      await db.runAsync("DELETE FROM health_records");
      const expanded =
        ((
          await db.getFirstAsync<{ user_version: number }>(
            "PRAGMA user_version",
          )
        )?.user_version ?? 0) >= 4;
      if (b.version === 2 && !expanded)
        throw new Error("Expanded backups need database v4.");
      for (const r of b.records) {
        const inserted = await db.runAsync(
          "INSERT INTO health_records(date,steps,calories,water) VALUES(?,?,?,?)",
          r.date,
          r.steps,
          r.calories,
          r.water,
        );
        if (expanded) {
          await db.runAsync(
            "INSERT INTO record_annotations(record_id,note) VALUES(?,?)",
            inserted.lastInsertRowId,
            r.note ?? "",
          );
          for (const tag of r.tags ?? [])
            await db.runAsync(
              "INSERT INTO record_tags(record_id,tag) VALUES(?,?)",
              inserted.lastInsertRowId,
              tag,
            );
        }
      }
      if (expanded) {
        const personalization = new SQLitePersonalizationRepository(
          async () => db,
        );
        await personalization.saveProfile(b.profile ?? { ...emptyProfile });
        await personalization.saveLayout(b.layout ?? defaultLayout());
      }
      await new SQLiteHealthGoalRepository(async () => db).saveGoals(b.goals);
      await writePreferences(db, b.preferences);
      await db.execAsync("COMMIT");
    } catch (e) {
      await db.execAsync("ROLLBACK");
      throw e;
    }
  }
}
