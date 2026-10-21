import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeDatabase } from "../src/data/database/preferencesMigration";
import { SQLiteBackupRepository } from "../src/data/backup/SQLiteBackupRepository";
import {
  parseBackup,
  validateBackup,
  maxBackupBytes,
  type HealthBackup,
} from "../src/domain/backup/backup";
import { defaultPreferences } from "../src/domain/preferences/preferences";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
import { databaseAccess } from "../src/data/database/access";
const sample = (): HealthBackup => ({
  format: "healthmate-backup",
  version: 1,
  exportedAt: "2026-10-21T10:00:00.000Z",
  records: [
    { date: "2026-10-20", steps: 7850, calories: 400, water: 2500 },
    { date: "2026-10-19", steps: 0, calories: 0, water: 0 },
  ],
  goals: { steps: 10000, calories: null, water: 2500 },
  preferences: {
    ...defaultPreferences,
    theme: "dark",
    reminderEnabled: true,
    reminderHour: 9,
    reminderMinute: 15,
  },
});
async function setup() {
  const a = sqliteAdapter();
  await initializeDatabase(a.db);
  return { ...a, repo: new SQLiteBackupRepository(async () => a.db) };
}
test("B02 validated backup round trip preserves zeros, nullable goals and preferences, with deterministic ordering", () => {
  const b = parseBackup(JSON.stringify(sample()));
  assert.deepEqual(
    b.records.map((r) => r.date),
    ["2026-10-19", "2026-10-20"],
  );
  assert.deepEqual(parseBackup(JSON.stringify(b)), b);
});
test("B03 malformed, unsupported and unexpected fields reject", () => {
  assert.throws(() => parseBackup("{"));
  for (const x of [
    { ...sample(), version: 2 },
    { ...sample(), format: "other" },
    { ...sample(), extra: true },
    { ...sample(), exportedAt: "invalid" },
    { ...sample(), records: null },
    { ...sample(), goals: { steps: 0, calories: null, water: null } },
    { ...sample(), preferences: { ...defaultPreferences, theme: "purple" } },
  ])
    assert.throws(() => validateBackup(x));
});
test("B04 untrusted records reject duplicate dates, bad calendars, limits and extra IDs", () => {
  const r = sample().records[0];
  for (const records of [
    [r, r],
    [{ ...r, date: "2026-02-30" }],
    [{ ...r, date: "2999-01-01" }],
    [{ ...r, steps: -1 }],
    [{ ...r, water: 20001 }],
    [{ ...r, calories: 1.2 }],
    [{ ...r, steps: "12" }],
    [{ ...r, id: 42 }],
  ])
    assert.throws(() => validateBackup({ ...sample(), records }));
});
test("B05 file and record count limits reject oversized input", () => {
  assert.throws(() => parseBackup(" ".repeat(maxBackupBytes + 1)));
  assert.throws(() =>
    validateBackup({
      ...sample(),
      records: Array(20001).fill(sample().records[0]),
    }),
  );
});
test("B06 real SQLite replace restores all settings and never changes migration metadata", async () => {
  const a = await setup();
  try {
    await a.db.runAsync(
      "INSERT INTO health_records(date,steps,calories,water) VALUES('2026-10-18',1,2,3)",
    );
    await a.repo.restore(sample());
    const b = await a.repo.snapshot();
    assert.deepEqual(b.records, validateBackup(sample()).records);
    assert.deepEqual(b.goals, sample().goals);
    assert.deepEqual(b.preferences, sample().preferences);
    assert.equal(
      (
        await a.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      3,
    );
  } finally {
    a.close();
  }
});
test("B07 failure after deletion/insertion rolls back original records, goals and preferences", async () => {
  const a = await setup();
  try {
    await a.repo.restore(sample());
    const before = await a.repo.snapshot();
    let writes = 0;
    const failing = {
      ...a.db,
      runAsync: async (sql: string, ...params: (string | number | null)[]) => {
        if (++writes === 4) throw Error("simulated disk write failure");
        return a.db.runAsync(sql, ...params);
      },
    };
    await assert.rejects(() =>
      new SQLiteBackupRepository(async () => failing).restore({
        ...sample(),
        records: [{ date: "2026-10-18", steps: 1, calories: 2, water: 3 }],
        goals: { steps: 2000, calories: 300, water: 1000 },
        preferences: { ...defaultPreferences, theme: "light" },
      }),
    );
    const after = await a.repo.snapshot();
    assert.deepEqual(after.records, before.records);
    assert.deepEqual(after.goals, before.goals);
    assert.deepEqual(after.preferences, before.preferences);
  } finally {
    a.close();
  }
});
test("B08 invalid backup never starts destructive SQL", async () => {
  const a = await setup();
  try {
    await a.repo.restore(sample());
    await assert.rejects(() => a.repo.restore({ ...sample(), version: 9 }));
    assert.equal((await a.repo.snapshot()).records.length, 2);
  } finally {
    a.close();
  }
});
test("B09 empty backup restores genuinely empty records and unset goals", async () => {
  const a = await setup();
  try {
    await a.repo.restore(sample());
    await a.repo.restore({
      ...sample(),
      records: [],
      goals: { steps: null, calories: null, water: null },
    });
    assert.deepEqual((await a.repo.snapshot()).records, []);
  } finally {
    a.close();
  }
});
test("B10 canonical record state follows restored rows without redundant data", async () => {
  const a = await setup();
  try {
    const store = createHealthRecordStore(
      new SQLiteHealthRecordRepository(async () => a.db),
    );
    await store.getState().refresh();
    await a.repo.restore(sample());
    store
      .getState()
      .replaceFromStorage(
        await new SQLiteHealthRecordRepository(
          async () => a.db,
        ).getAllRecords(),
      );
    assert.equal(store.getState().records.length, 2);
    assert.equal(store.getState().records[0].steps, 7850);
  } finally {
    a.close();
  }
});
test("B11 shared database gate serializes whole operations including failures", async () => {
  const order: string[] = [];
  await Promise.allSettled([
    databaseAccess(async () => {
      order.push("start");
      await Promise.resolve();
      order.push("end");
      throw Error("failed transaction");
    }),
    databaseAccess(async () => {
      order.push("next");
    }),
  ]);
  assert.deepEqual(order, ["start", "end", "next"]);
});
test("B12 sizeable backup uses full actual SQLite snapshot", async () => {
  const a = await setup();
  try {
    const records = [];
    for (let i = 0; i < 1000; i++) {
      const d = new Date(2020, 0, 1 + i, 12);
      const date =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");
      records.push({ date, steps: i, calories: 0, water: 0 });
    }
    await a.repo.restore({ ...sample(), records });
    assert.equal((await a.repo.snapshot()).records.length, 1000);
  } finally {
    a.close();
  }
});
