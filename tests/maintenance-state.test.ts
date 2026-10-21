import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeExpandedDatabase } from "../src/data/database/expandedMigration";
import { SQLiteAnnotatedRecordRepository } from "../src/data/repositories/SQLiteAnnotatedRecordRepository";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
test("A refresh started before reset cannot resurrect deleted canonical records", async () => {
  const a = sqliteAdapter();
  try {
    await initializeExpandedDatabase(a.db);
    const repo = new SQLiteAnnotatedRecordRepository(async () => a.db);
    await repo.createRecord({
      date: "2026-01-01",
      steps: 0,
      calories: 0,
      water: 0,
      note: "old",
      tags: ["Yoga"],
    });
    const previous = await repo.getAllRecords();
    let release!: (rows: typeof previous) => void;
    let first = true;
    repo.getAllRecords = () =>
      first
        ? ((first = false),
          new Promise((resolve) => {
            release = resolve;
          }))
        : Promise.resolve([]);
    const store = createHealthRecordStore(repo);
    const pending = store.getState().refresh();
    store.getState().replaceFromStorage([]);
    release(previous);
    await pending;
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(store.getState().records, []);
    assert.equal(store.getState().hasLoaded, true);
  } finally {
    a.close();
  }
});
