import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { migrateDatabase } from "../src/data/database/migrations";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
import { waterPrefill } from "../src/domain/records/quickWater";
async function setup() {
  const a = sqliteAdapter();
  await migrateDatabase(a.db);
  return { ...a, repo: new SQLiteHealthRecordRepository(async () => a.db) };
}
test("W01 atomic increments preserve ID, date, steps and calories", async () => {
  const a = await setup();
  try {
    const r = await a.repo.createRecord({
      date: "2026-10-21",
      steps: 7850,
      calories: 400,
      water: 0,
    });
    for (const amount of [250, 500, 1000])
      await a.repo.incrementWater(r.date, amount);
    assert.deepEqual(await a.repo.getRecordById(r.id), { ...r, water: 1750 });
  } finally {
    a.close();
  }
});
test("W02 concurrent SQL increments lose no accepted updates", async () => {
  const a = await setup();
  try {
    await a.repo.createRecord({
      date: "2026-10-21",
      steps: 1,
      calories: 2,
      water: 0,
    });
    await Promise.all(
      Array.from({ length: 20 }, () =>
        a.repo.incrementWater("2026-10-21", 250),
      ),
    );
    assert.equal((await a.repo.getRecordByDate("2026-10-21"))?.water, 5000);
  } finally {
    a.close();
  }
});
test("W03 maximum and missing rows reject without creating or changing records", async () => {
  const a = await setup();
  try {
    await assert.rejects(() => a.repo.incrementWater("2026-10-21", 250));
    assert.deepEqual(await a.repo.getAllRecords(), []);
    await a.repo.createRecord({
      date: "2026-10-21",
      steps: 0,
      calories: 0,
      water: 19750,
    });
    await a.repo.incrementWater("2026-10-21", 250);
    await assert.rejects(() => a.repo.incrementWater("2026-10-21", 250));
    assert.equal((await a.repo.getRecordByDate("2026-10-21"))?.water, 20000);
    await assert.rejects(async () => a.repo.incrementWater("2026-10-21", -250));
  } finally {
    a.close();
  }
});
test("W04 store publishes saved result and safely reports database failure", async () => {
  const a = await setup();
  try {
    await a.repo.createRecord({
      date: "2026-10-21",
      steps: 0,
      calories: 0,
      water: 0,
    });
    const store = createHealthRecordStore(a.repo);
    await store.getState().refresh();
    assert.equal(await store.getState().addWater("2026-10-21", 500), true);
    assert.equal(store.getState().records[0].water, 500);
  } finally {
    a.close();
  }
  const repo = new SQLiteHealthRecordRepository(async () => {
    throw Error("disk");
  });
  const store = createHealthRecordStore(repo);
  assert.equal(await store.getState().addWater("2026-10-21", 250), false);
  assert.ok(store.getState().error);
});
test("W05 route prefill accepts only explicit supported amounts, not arrays", () => {
  for (const n of ["250", "500", "1000"]) assert.equal(waterPrefill(n), n);
  for (const n of [250, ["250"], "-1", "20001", "1e3", undefined])
    assert.equal(waterPrefill(n), "");
});
