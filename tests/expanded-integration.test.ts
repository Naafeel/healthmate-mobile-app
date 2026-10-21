import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeExpandedDatabase } from "../src/data/database/expandedMigration";
import { SQLiteAnnotatedRecordRepository } from "../src/data/repositories/SQLiteAnnotatedRecordRepository";
import { SQLiteBackupRepository } from "../src/data/backup/SQLiteBackupRepository";
import { validateBackup } from "../src/domain/backup/backup";
import { defaultPreferences } from "../src/domain/preferences/preferences";
import { emptyProfile } from "../src/domain/profile/profile";
import { defaultLayout } from "../src/domain/dashboard/layout";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
import { useDataMaintenance } from "../src/store/dataMaintenance";
import { recordsCsv } from "../src/domain/records/recordCsv";
import { achievements } from "../src/domain/achievements/achievements";
import { weeklySummary } from "../src/domain/sharing/weeklySummary";
import { filterRecords, emptyFilters } from "../src/domain/records/search";
test("Quick water preserves annotations and drives current goals, summaries, search and unchanged CSV schema", async () => {
  const a = sqliteAdapter();
  try {
    await initializeExpandedDatabase(a.db);
    const r = new SQLiteAnnotatedRecordRepository(async () => a.db);
    await r.createRecord({
      date: "2026-01-01",
      steps: 1,
      calories: 2,
      water: 0,
      note: '=private, "quoted"\n🌿',
      tags: ["Walking"],
    });
    await r.incrementWater("2026-01-01", 250);
    const rows = await r.getAllRecords();
    assert.equal(rows[0].note, '=private, "quoted"\n🌿');
    assert.deepEqual(rows[0].tags, ["Walking"]);
    assert.equal(
      achievements(
        rows,
        { steps: null, calories: null, water: 250 },
        "2026-01-01",
      )[7].unlocked,
      true,
    );
    assert.equal(weeklySummary(rows, "2026-01-01").metrics[2].total, 250);
    assert.equal(
      filterRecords(rows, {
        ...emptyFilters(),
        tags: ["Walking"],
        keyword: "🌿",
      }).length,
      1,
    );
    const csv = recordsCsv(rows)!;
    assert.ok(csv.startsWith("date,steps,calories_burned_kcal,water_ml\r\n"));
    assert.ok(!csv.includes("private"));
  } finally {
    a.close();
  }
});
test("Expanded backup validates profile, notes, tags, layout and future versions before destructive SQL", () => {
  const b = {
    format: "healthmate-backup",
    version: 2,
    exportedAt: "2026-01-01T00:00:00.000Z",
    records: [
      {
        date: "2026-01-01",
        steps: 0,
        calories: 0,
        water: 0,
        note: "",
        tags: [],
      },
    ],
    goals: { steps: null, calories: null, water: null },
    preferences: defaultPreferences,
    profile: emptyProfile,
    layout: defaultLayout(),
  };
  assert.equal(validateBackup(b).version, 2);
  for (const patch of [
    { version: 3 },
    { profile: { ...emptyProfile, height: Infinity } },
    { layout: [defaultLayout()[0], defaultLayout()[0]] },
    { records: [{ ...b.records[0], note: "x".repeat(501) }] },
    { records: [{ ...b.records[0], tags: ["Unknown"] }] },
    { records: [b.records[0], b.records[0]] },
  ])
    assert.throws(() => validateBackup({ ...b, ...patch }));
});
test("Expanded backup restore rolls back profile, layout and associated annotations on injected failure", async () => {
  const a = sqliteAdapter();
  try {
    await initializeExpandedDatabase(a.db);
    const r = new SQLiteAnnotatedRecordRepository(async () => a.db);
    await r.createRecord({
      date: "2026-01-01",
      steps: 0,
      calories: 0,
      water: 0,
      note: "original",
      tags: ["Yoga"],
    });
    const repo = new SQLiteBackupRepository(async () => a.db),
      b = await repo.snapshot();
    await a.db.execAsync(
      "CREATE TRIGGER fail_profile BEFORE INSERT ON personal_profile BEGIN SELECT RAISE(ABORT,'synthetic'); END;",
    );
    await assert.rejects(() => repo.restore({ ...b, records: [] }));
    assert.equal((await r.getAllRecords())[0].note, "original");
    assert.deepEqual((await r.getAllRecords())[0].tags, ["Yoga"]);
  } finally {
    a.close();
  }
});
test("Maintenance blocks record, deletion and water writes", async () => {
  const a = sqliteAdapter();
  try {
    await initializeExpandedDatabase(a.db);
    const r = new SQLiteAnnotatedRecordRepository(async () => a.db),
      store = createHealthRecordStore(r);
    useDataMaintenance.setState({ busy: true });
    await assert.rejects(
      () =>
        store
          .getState()
          .save({ date: "2026-01-01", steps: 0, calories: 0, water: 0 }),
      /wait/i,
    );
    assert.equal(await store.getState().remove(1), false);
    assert.equal(await store.getState().addWater("2026-01-01", 250), false);
    assert.equal((await r.getAllRecords()).length, 0);
  } finally {
    useDataMaintenance.setState({ busy: false });
    a.close();
  }
});
