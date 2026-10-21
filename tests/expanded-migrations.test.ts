import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeExpandedDatabase } from "../src/data/database/expandedMigration";
import { createHealthRecordsSQL } from "../src/data/database/migrations";
import { createHealthGoalsSQL } from "../src/data/database/goalsMigration";
import { preferencesSQL } from "../src/data/database/preferencesMigration";
import { SQLitePersonalizationRepository } from "../src/data/repositories/SQLitePersonalizationRepository";
import { SQLiteAnnotatedRecordRepository } from "../src/data/repositories/SQLiteAnnotatedRecordRepository";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emptyProfile } from "../src/domain/profile/profile";
for (const version of [0, 1, 2, 3])
  test(`Schema ${version} upgrades to v4 without destructive migration`, async () => {
    const a = sqliteAdapter();
    try {
      if (version) {
        await a.db.execAsync(
          createHealthRecordsSQL +
            (version >= 2 ? createHealthGoalsSQL : "") +
            (version >= 3 ? preferencesSQL : "") +
            `PRAGMA user_version=${version};`,
        );
        await a.db.runAsync(
          "INSERT INTO health_records(date,steps,calories,water) VALUES('2026-01-01',1,2,3)",
        );
      }
      await initializeExpandedDatabase(a.db);
      await initializeExpandedDatabase(a.db);
      assert.equal(
        (
          await a.db.getFirstAsync<{ user_version: number }>(
            "PRAGMA user_version",
          )
        )?.user_version,
        4,
      );
      assert.equal(
        (
          await new SQLiteAnnotatedRecordRepository(
            async () => a.db,
          ).getAllRecords()
        ).length,
        version ? 1 : 0,
      );
      await assert.rejects(
        () =>
          a.db.runAsync(
            "INSERT INTO record_tags(record_id,tag) VALUES(999,'Walking')",
          ),
        /FOREIGN KEY/,
      );
    } finally {
      a.close();
    }
  });
test("Profile/layout/notes and enforced foreign keys survive a real database close and reopen", async () => {
  const dir = mkdtempSync(join(tmpdir(), "healthmate09-"));
  const file = join(dir, "disposable.db");
  let a = sqliteAdapter(file);
  try {
    await initializeExpandedDatabase(a.db);
    await new SQLitePersonalizationRepository(async () => a.db).saveProfile({
      ...emptyProfile,
      name: "Synthetic",
      waterUnit: "L",
    });
    await new SQLitePersonalizationRepository(async () => a.db).saveLayout([
      { id: "water", visible: false },
    ]);
    await new SQLiteAnnotatedRecordRepository(async () => a.db).createRecord({
      date: "2026-01-01",
      steps: 0,
      calories: 0,
      water: 250,
      note: "test",
      tags: ["Yoga"],
    });
    a.close();
    a = sqliteAdapter(file);
    await initializeExpandedDatabase(a.db);
    const p = await new SQLitePersonalizationRepository(async () => a.db).get();
    assert.equal(p.profile.name, "Synthetic");
    assert.equal(p.layout[0].visible, false);
    assert.equal(
      (
        await new SQLiteAnnotatedRecordRepository(
          async () => a.db,
        ).getAllRecords()
      )[0].water,
      250,
    );
    assert.equal(
      (
        await a.db.getFirstAsync<{ foreign_keys: number }>(
          "PRAGMA foreign_keys",
        )
      )?.foreign_keys,
      1,
    );
  } finally {
    a.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("Failed v4 migration rolls back new tables and version; future schema rejects without downgrade", async () => {
  const a = sqliteAdapter();
  try {
    await a.db.execAsync(
      createHealthRecordsSQL +
        createHealthGoalsSQL +
        preferencesSQL +
        "PRAGMA user_version=3;CREATE TABLE personal_profile(dummy TEXT);",
    );
    await assert.rejects(() => initializeExpandedDatabase(a.db));
    assert.equal(
      (
        await a.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      3,
    );
    assert.equal(
      await a.db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE name='record_annotations'",
      ),
      null,
    );
    await a.db.execAsync("PRAGMA user_version=99");
    await assert.rejects(() => initializeExpandedDatabase(a.db), /newer/);
    assert.equal(
      (
        await a.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      99,
    );
  } finally {
    a.close();
  }
});
