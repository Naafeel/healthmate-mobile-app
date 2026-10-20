import { test } from "node:test";
import assert from "node:assert/strict";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { migrateDatabase } from "../src/data/database/migrations";
import { sqliteAdapter } from "./sqliteAdapter";
import { samples } from "./fixtures/records";
test("S01 shared state follows SQLite create, edit, delete and reports success", async () => {
  const db = sqliteAdapter();
  try {
    await migrateDatabase(db.db);
    const repo = new SQLiteHealthRecordRepository(async () => db.db);
    const store = createHealthRecordStore(repo);
    await store.getState().refresh();
    const r = await store.getState().save(samples[0]);
    assert.equal(store.getState().records[0].id, r.id);
    await store.getState().save({ ...samples[0], steps: 42 }, r.id);
    assert.equal(store.getState().records[0].steps, 42);
    assert.equal(await store.getState().remove(r.id), true);
    assert.equal(store.getState().records.length, 0);
    assert.match(store.getState().success ?? "", /deleted/);
  } finally {
    db.close();
  }
});
import { RecordError } from "../src/domain/records/recordErrors";
import type { HealthRecordRepository } from "../src/domain/repositories/HealthRecordRepository";
import type { HealthRecord } from "../src/domain/models/HealthRecord";

test("S02 failed deletion remains visible; retry refresh recovers", async () => {
  const adapter = sqliteAdapter();
  try {
    await migrateDatabase(adapter.db);
    const repo = new SQLiteHealthRecordRepository(async () => adapter.db);
    const record = await repo.createRecord(samples[0]);
    const store = createHealthRecordStore(repo);
    await store.getState().refresh();
    await repo.deleteRecord(record.id);
    assert.equal(await store.getState().remove(record.id), false);
    assert.match(store.getState().error ?? "", /already been removed/);
    assert.equal(store.getState().mutating, false);
    await store.getState().refresh();
    assert.equal(store.getState().records.length, 0);
    assert.equal(store.getState().error, null);
  } finally {
    adapter.close();
  }
});
test("S03 repeated submissions are rejected during a pending mutation", async () => {
  const adapter = sqliteAdapter();
  try {
    await migrateDatabase(adapter.db);
    const repo = new SQLiteHealthRecordRepository(async () => adapter.db);
    const store = createHealthRecordStore(repo);
    const first = store.getState().save(samples[0]);
    await assert.rejects(
      () => store.getState().save(samples[1]),
      (e) => e instanceof RecordError && e.code === "busy",
    );
    await first;
    assert.equal((await repo.getAllRecords()).length, 1);
  } finally {
    adapter.close();
  }
});
test("S04 an old refresh cannot replace a newly saved record", async () => {
  const adapter = sqliteAdapter();
  try {
    await migrateDatabase(adapter.db);
    const repo = new SQLiteHealthRecordRepository(async () => adapter.db);
    let release!: (rows: HealthRecord[]) => void;
    let first = true;
    const delayed = new Proxy(repo, {
      get(target, key) {
        if (key === "getAllRecords")
          return () => {
            if (first) {
              first = false;
              return new Promise<HealthRecord[]>((resolve) => {
                release = resolve;
              });
            }
            return target.getAllRecords();
          };
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as HealthRecordRepository;
    const store = createHealthRecordStore(delayed);
    const refresh = store.getState().refresh();
    const saved = await store.getState().save(samples[0]);
    release([]);
    await refresh;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(store.getState().records[0].id, saved.id);
    assert.equal(store.getState().loading, false);
  } finally {
    adapter.close();
  }
});
test("S05 unavailable database produces a retryable load error without rejection", async () => {
  const repo = new SQLiteHealthRecordRepository(async () => {
    throw Error("unavailable");
  });
  const store = createHealthRecordStore(repo);
  await store.getState().refresh();
  assert.equal(store.getState().loading, false);
  assert.match(store.getState().error ?? "", /device database/);
});
