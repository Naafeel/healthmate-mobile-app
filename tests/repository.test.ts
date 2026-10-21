import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrateDatabase } from "../src/data/database/migrations";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { RecordError } from "../src/domain/records/recordErrors";
import { samples } from "./fixtures/records";
import { sqliteAdapter } from "./sqliteAdapter";
async function setup() {
  const adapter = sqliteAdapter();
  await migrateDatabase(adapter.db);
  return {
    ...adapter,
    repo: new SQLiteHealthRecordRepository(async () => adapter.db),
  };
}
const code = (expected: string) => (e: unknown) =>
  e instanceof RecordError && e.code === expected;
test("DB01 create, typed retrieve and newest-first order", async () => {
  const { repo, close } = await setup();
  try {
    const first = await repo.createRecord(samples[0]);
    await repo.createRecord(samples[1]);
    assert.deepEqual(await repo.getRecordById(first.id), first);
    assert.deepEqual(await repo.getRecordByDate(first.date), first);
    assert.deepEqual(
      (await repo.getAllRecords()).map((r) => r.date),
      ["2024-03-01", "2024-02-29"],
    );
  } finally {
    close();
  }
});
test("DB02 duplicate dates never overwrite and identify existing record", async () => {
  const { repo, close } = await setup();
  try {
    const r = await repo.createRecord(samples[0]);
    await assert.rejects(
      () => repo.createRecord({ ...samples[0], steps: 9 }),
      (e) => code("duplicate")(e) && (e as RecordError).existingId === r.id,
    );
    assert.equal((await repo.getRecordById(r.id))?.steps, 7200);
  } finally {
    close();
  }
});
test("DB03 update preserves ID, values and date; collisions rejected", async () => {
  const { repo, close } = await setup();
  try {
    const a = await repo.createRecord(samples[0]);
    const b = await repo.createRecord(samples[1]);
    const changed = await repo.updateRecord(a.id, {
      ...samples[2],
      steps: 123,
    });
    assert.equal(changed.id, a.id);
    assert.deepEqual(await repo.getRecordById(a.id), changed);
    await assert.rejects(
      () => repo.updateRecord(a.id, { ...samples[0], date: b.date }),
      code("duplicate"),
    );
    assert.deepEqual(await repo.getRecordById(a.id), changed);
  } finally {
    close();
  }
});
test("DB04 delete and missing records", async () => {
  const { repo, close } = await setup();
  try {
    assert.equal(await repo.getRecordById(99), null);
    assert.equal(await repo.getRecordByDate("2024-01-01"), null);
    const a = await repo.createRecord(samples[0]);
    await repo.deleteRecord(a.id);
    assert.equal(await repo.getRecordById(a.id), null);
    await assert.rejects(
      () => repo.updateRecord(a.id, samples[0]),
      code("missing"),
    );
    await assert.rejects(() => repo.deleteRecord(a.id), code("missing"));
  } finally {
    close();
  }
});
test("DB05 inclusive date range, exact filter and no results", async () => {
  const { repo, close } = await setup();
  try {
    for (const s of samples) await repo.createRecord(s);
    assert.equal(
      (await repo.getRecordsByDateRange("2024-02-29", "2024-03-01")).length,
      2,
    );
    assert.equal(await repo.getRecordByDate("2024-03-03"), null);
    assert.equal((await repo.getRecordByDate("2024-03-02"))?.steps, 0);
  } finally {
    close();
  }
});
test("DB06 SQLite rejects invalid calendar, decimal, negative and excessive values directly", async () => {
  const { db, close } = await setup();
  try {
    for (const [date, steps] of [
      ["2023-02-29", 1],
      ["2024-04-31", 1],
      ["2024-02-29", -1],
      ["2024-02-29", 1.5],
      ["2024-02-29", 200001],
    ] as const)
      await assert.rejects(() =>
        db.runAsync(
          "INSERT INTO health_records(date,steps,calories,water) VALUES(?,?,?,?)",
          date,
          steps,
          0,
          0,
        ),
      );
  } finally {
    close();
  }
});
test("DB07 migration idempotence and version safety preserve rows", async () => {
  const { db, repo, close } = await setup();
  try {
    const a = await repo.createRecord(samples[0]);
    await migrateDatabase(db);
    assert.deepEqual(await repo.getRecordById(a.id), a);
    assert.equal(
      (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))
        ?.user_version,
      2,
    );
    await db.execAsync("PRAGMA user_version=3");
    await assert.rejects(() => migrateDatabase(db));
    assert.deepEqual(await repo.getRecordById(a.id), a);
  } finally {
    close();
  }
});
test("DB08 file persistence after close and reopen", async () => {
  const dir = mkdtempSync(join(tmpdir(), "healthmate-test-"));
  let db = sqliteAdapter(join(dir, "records.db"));
  try {
    await migrateDatabase(db.db);
    const repo = new SQLiteHealthRecordRepository(async () => db.db);
    const record = await repo.createRecord(samples[0]);
    db.close();
    db = sqliteAdapter(join(dir, "records.db"));
    await migrateDatabase(db.db);
    assert.deepEqual(await repo.getRecordById(record.id), record);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("DB09 invalid IDs, date queries, and storage failures are predictable", async () => {
  const { repo, close } = await setup();
  try {
    assert.throws(() => repo.getRecordById(-1), code("validation"));
    assert.throws(
      () => repo.getRecordByDate("2024-01-01' OR 1=1"),
      code("validation"),
    );
    assert.throws(
      () => repo.getRecordsByDateRange("2024-03-01", "2024-02-01"),
      code("validation"),
    );
    const broken = new SQLiteHealthRecordRepository(async () => {
      throw Error("disk unavailable");
    });
    await assert.rejects(() => broken.getAllRecords(), code("storage"));
  } finally {
    close();
  }
});
