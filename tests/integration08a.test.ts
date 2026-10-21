import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeDatabase } from "../src/data/database/preferencesMigration";
import { SQLiteBackupRepository } from "../src/data/backup/SQLiteBackupRepository";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { SQLitePreferencesRepository } from "../src/data/repositories/SQLitePreferencesRepository";
import { defaultPreferences } from "../src/domain/preferences/preferences";
import { comparePeriods } from "../src/domain/analytics/comparisons";
import { periodFor } from "../src/domain/calendar/periods";
import { goalProgress } from "../src/domain/goals/progress";
import { loggingStreaks } from "../src/domain/records/loggingStreaks";
import { readFileSync } from "node:fs";
test("X01 water, backup, replace, close/reopen preserve persisted values and derived analytics", async () => {
  const dir = mkdtempSync(join(tmpdir(), "healthmate-08a-"));
  const file = join(dir, "test.db");
  let a = sqliteAdapter(file);
  try {
    await initializeDatabase(a.db);
    const records = new SQLiteHealthRecordRepository(async () => a.db);
    await records.createRecord({
      date: "2026-10-20",
      steps: 0,
      calories: 0,
      water: 0,
    });
    await records.createRecord({
      date: "2026-10-21",
      steps: 7850,
      calories: 400,
      water: 2500,
    });
    await records.incrementWater("2026-10-21", 500);
    await new SQLitePreferencesRepository(async () => a.db).save({
      ...defaultPreferences,
      theme: "dark",
      reminderEnabled: true,
      reminderHour: 9,
    });
    const backup = await new SQLiteBackupRepository(
      async () => a.db,
    ).snapshot();
    backup.goals = { steps: 10000, calories: 500, water: 2500 };
    await new SQLiteBackupRepository(async () => a.db).restore(backup);
    a.close();
    a = sqliteAdapter(file);
    await initializeDatabase(a.db);
    const after = await new SQLiteBackupRepository(async () => a.db).snapshot();
    assert.deepEqual(after.records, backup.records);
    assert.deepEqual(after.goals, backup.goals);
    assert.deepEqual(after.preferences, backup.preferences);
    const rows = await new SQLiteHealthRecordRepository(
      async () => a.db,
    ).getAllRecords();
    assert.equal(
      comparePeriods(
        rows,
        "water",
        periodFor("2026-10-21", "weekly"),
        "weekly",
        "2026-10-21",
      ).current.total,
      3000,
    );
    assert.deepEqual(
      loggingStreaks(
        rows.map((r) => r.date),
        "2026-10-21",
      ),
      { current: 2, longest: 2 },
    );
    const progress = goalProgress(3000, 2500);
    assert.equal(progress.status, "ready");
    if (progress.status === "ready") assert.equal(progress.percent, 120);
  } finally {
    a.close();
    const target = resolve(dir);
    assert.ok(target.startsWith(resolve(tmpdir()) + requireSeparator()));
    rmSync(target, { recursive: true, force: true });
  }
});
function requireSeparator() {
  return process.platform === "win32" ? "\\" : "/";
}
test("X02 calendar comparison windows retain dates across local timezone and DST changes", () => {
  const original = process.env.TZ;
  try {
    for (const zone of [
      "Asia/Colombo",
      "Pacific/Honolulu",
      "America/New_York",
    ]) {
      process.env.TZ = zone;
      const c = comparePeriods(
        [],
        "steps",
        periodFor("2024-03-13", "weekly"),
        "weekly",
        "2024-03-13",
      );
      assert.deepEqual(c.current.period, {
        start: "2024-03-11",
        end: "2024-03-13",
      });
      assert.deepEqual(c.previous.period, {
        start: "2024-03-04",
        end: "2024-03-06",
      });
      assert.equal(c.current.days, 3);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
test("X03 original signing certificate is checked before any prebuild and after APK assembly", () => {
  const s = readFileSync("scripts/Build-AndroidRelease.ps1", "utf8");
  assert.ok(
    s.indexOf("Signing identity mismatch") < s.indexOf("npx.cmd expo prebuild"),
  );
  assert.match(
    s,
    /82a0a426d562ff060fad55fcd6a97954ab845c270723915f43dfe90e50bcda5d/,
  );
  assert.match(s, /apksigner verify --verbose --print-certs/);
  assert.doesNotMatch(s, /Initialize-ReleaseSigning\.ps1\s*$/m);
});
