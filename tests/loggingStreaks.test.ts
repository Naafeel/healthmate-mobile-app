import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { loggingStreaks } from "../src/domain/records/loggingStreaks";
import { shiftDay } from "../src/domain/calendar/dates";
import { sqliteAdapter } from "./sqliteAdapter";
import { migrateDatabase } from "../src/data/database/migrations";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
const today = "2026-10-21";
test("LS01–LS02 empty and one logged day", () => {
  assert.deepEqual(loggingStreaks([], today), { current: 0, longest: 0 });
  assert.deepEqual(loggingStreaks([today], today), { current: 1, longest: 1 });
  assert.deepEqual(loggingStreaks(["2026-10-01"], today), {
    current: 0,
    longest: 1,
  });
});
test("LS03–LS05 consecutive today, yesterday grace and expired current run", () => {
  assert.deepEqual(loggingStreaks(["2026-10-19", "2026-10-20", today], today), {
    current: 3,
    longest: 3,
  });
  const dates = ["2026-10-18", "2026-10-19", "2026-10-20"];
  assert.deepEqual(loggingStreaks(dates, today), { current: 3, longest: 3 });
  assert.deepEqual(loggingStreaks(dates, "2026-10-22"), {
    current: 0,
    longest: 3,
  });
});
test("LS07–LS08 missing day splits runs and longest scans all history", () => {
  const dates = [
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
    "2026-10-19",
    today,
  ];
  assert.deepEqual(loggingStreaks(dates.reverse(), today), {
    current: 1,
    longest: 4,
  });
});
test("LS09 leap-year and year boundaries use calendar adjacency", () => {
  assert.deepEqual(
    loggingStreaks(["2024-02-28", "2024-02-29", "2024-03-01"], "2024-03-01"),
    { current: 3, longest: 3 },
  );
  assert.deepEqual(loggingStreaks(["2025-12-31", "2026-01-01"], "2026-01-01"), {
    current: 2,
    longest: 2,
  });
});
test("LS10 timezone and DST do not divide timestamp milliseconds", () => {
  for (const zone of ["Asia/Colombo", "Pacific/Honolulu", "America/New_York"]) {
    const output = execFileSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "-e",
        `const {loggingStreaks}=require('./src/domain/records/loggingStreaks.ts');console.log(JSON.stringify(loggingStreaks(['2024-03-09','2024-03-10','2024-03-11'],'2024-03-11')));`,
      ],
      { env: { ...process.env, TZ: zone }, encoding: "utf8" },
    ).trim();
    assert.deepEqual(JSON.parse(output), { current: 3, longest: 3 });
  }
});
test("LS06/LS11 real SQLite zeros count; date update/delete recalculate", async () => {
  const a = sqliteAdapter();
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  try {
    await migrateDatabase(a.db);
    const store = createHealthRecordStore(
      new SQLiteHealthRecordRepository(async () => a.db),
    );
    await store.getState().refresh();
    const input = { date: "2024-02-28", steps: 0, calories: 0, water: 0 };
    const first = await store.getState().save(input);
    await tick();
    await store.getState().save({ ...input, date: "2024-02-29" });
    await tick();
    const result = () =>
      loggingStreaks(
        store.getState().records.map((r) => r.date),
        "2024-03-01",
      );
    assert.deepEqual(result(), { current: 2, longest: 2 });
    await store.getState().save({ ...input, date: "2024-02-27" }, first.id);
    await tick();
    assert.deepEqual(result(), { current: 1, longest: 1 });
    await store.getState().remove(first.id);
    await tick();
    assert.deepEqual(result(), { current: 1, longest: 1 });
    const last = store.getState().records[0];
    await store.getState().remove(last.id);
    await tick();
    assert.deepEqual(result(), { current: 0, longest: 0 });
  } finally {
    a.close();
  }
});
test("LS12 duplicates and future dates cannot inflate streaks", () => {
  assert.deepEqual(
    loggingStreaks([today, today, "2026-10-22", "2026-10-23"], today),
    { current: 1, longest: 1 },
  );
  assert.deepEqual(loggingStreaks(["2026-10-22"], today), {
    current: 0,
    longest: 0,
  });
  assert.throws(() => loggingStreaks(["invalid"], today));
});
test("Long history uses one unique-date scan and preserves input", () => {
  const dates = Array.from({ length: 10000 }, (_, i) =>
    shiftDay("1990-01-01", i),
  );
  const copy = [...dates];
  const result = loggingStreaks(dates, dates.at(-1)!);
  assert.deepEqual(result, { current: 10000, longest: 10000 });
  assert.deepEqual(dates, copy);
});
