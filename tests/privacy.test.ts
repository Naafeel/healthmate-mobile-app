import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeExpandedDatabase } from "../src/data/database/expandedMigration";
import { SQLiteAnnotatedRecordRepository } from "../src/data/repositories/SQLiteAnnotatedRecordRepository";
import { SQLiteDataManagementRepository } from "../src/data/privacy/SQLiteDataManagementRepository";
import { SQLitePersonalizationRepository } from "../src/data/repositories/SQLitePersonalizationRepository";
import { SQLitePreferencesRepository } from "../src/data/repositories/SQLitePreferencesRepository";
import { SQLiteHealthGoalRepository } from "../src/data/repositories/SQLiteHealthGoalRepository";
import { SQLiteBackupRepository } from "../src/data/backup/SQLiteBackupRepository";
import { emptyProfile } from "../src/domain/profile/profile";
import { defaultPreferences } from "../src/domain/preferences/preferences";
import { achievements } from "../src/domain/achievements/achievements";
async function setup() {
  const a = sqliteAdapter();
  await initializeExpandedDatabase(a.db);
  const records = new SQLiteAnnotatedRecordRepository(async () => a.db),
    personal = new SQLitePersonalizationRepository(async () => a.db),
    prefs = new SQLitePreferencesRepository(async () => a.db),
    goals = new SQLiteHealthGoalRepository(async () => a.db);
  await records.createRecord({
    date: "2026-01-01",
    steps: 0,
    calories: 0,
    water: 0,
    note: "Synthetic",
    tags: ["Walking"],
  });
  await personal.saveProfile({ ...emptyProfile, name: "Synthetic" });
  await personal.saveLayout([{ id: "water", visible: false }]);
  await prefs.save({
    ...defaultPreferences,
    theme: "dark",
    reminderEnabled: true,
  });
  await goals.saveGoals({ steps: 10, calories: null, water: 500 });
  return { ...a, records, personal, prefs, goals };
}
test("Record-only deletion cascades private annotations but preserves profile, goals and all preferences", async () => {
  const a = await setup();
  try {
    const before = await a.personal.get();
    await new SQLiteDataManagementRepository(async () => a.db).clear(false);
    assert.equal((await a.records.getAllRecords()).length, 0);
    for (const t of ["record_annotations", "record_tags"])
      assert.equal(
        (await a.db.getFirstAsync<{ n: number }>(`SELECT count(*) n FROM ${t}`))
          ?.n,
        0,
      );
    assert.deepEqual(await a.personal.get(), before);
    assert.equal((await a.goals.getGoals()).steps, 10);
    assert.equal((await a.prefs.get()).theme, "dark");
    assert.equal(
      achievements([], await a.goals.getGoals(), "2026-10-21")[0].unlocked,
      false,
    );
  } finally {
    a.close();
  }
});
test("Full reset preserves schema version, resets optional data and permits complete backup restoration", async () => {
  const a = await setup();
  try {
    const backup = new SQLiteBackupRepository(async () => a.db),
      b = await backup.snapshot();
    await new SQLiteDataManagementRepository(async () => a.db).clear(true);
    assert.deepEqual((await a.personal.get()).profile, emptyProfile);
    assert.deepEqual(await a.prefs.get(), defaultPreferences);
    assert.equal((await a.goals.getGoals()).steps, null);
    assert.equal(
      (
        await a.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      4,
    );
    await backup.restore(b);
    assert.equal((await a.records.getAllRecords())[0].note, "Synthetic");
    assert.equal((await a.personal.get()).profile.name, "Synthetic");
  } finally {
    a.close();
  }
});
test("Failure midway through reset rolls back records, cascaded tags and settings", async () => {
  const a = await setup();
  try {
    await a.db.execAsync(
      "CREATE TRIGGER fail_reset BEFORE DELETE ON personal_profile BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;",
    );
    await assert.rejects(() =>
      new SQLiteDataManagementRepository(async () => a.db).clear(true),
    );
    assert.equal((await a.records.getAllRecords())[0].tags?.[0], "Walking");
    assert.equal((await a.goals.getGoals()).steps, 10);
    assert.equal((await a.prefs.get()).theme, "dark");
  } finally {
    a.close();
  }
});
