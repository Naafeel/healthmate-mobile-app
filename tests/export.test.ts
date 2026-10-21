import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, recordsCsv } from "../src/domain/records/recordCsv";
import {
  exportRecords,
  type ExportDependencies,
} from "../src/features/export/exportRecords";
import { sqliteAdapter } from "./sqliteAdapter";
import { migrateDatabase } from "../src/data/database/migrations";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
const row = {
  id: 9,
  date: "2026-10-21",
  steps: 8200,
  calories: 350,
  water: 2000,
};
const header = "date,steps,calories_burned_kcal,water_ml\r\n";
test("E01/E03/E04 exact CSV header, ISO date, plain integers and CRLF", () => {
  assert.equal(recordsCsv([row]), header + "2026-10-21,8200,350,2000\r\n");
  assert.equal(
    Buffer.from(recordsCsv([row])!, "utf8").toString("utf8"),
    recordsCsv([row]),
  );
  assert.ok(!recordsCsv([row])!.includes("8,200"));
});
test("E02/E05/E07 chronological complete rows including zero, no mutation", () => {
  const input = [
    row,
    { ...row, id: 8, date: "2026-10-19", steps: 0, calories: 0, water: 0 },
    { ...row, id: 10, date: "2026-10-20", steps: 8500 },
  ];
  const copy = [...input];
  assert.equal(
    recordsCsv(input),
    header +
      "2026-10-19,0,0,0\r\n2026-10-20,8500,350,2000\r\n2026-10-21,8200,350,2000\r\n",
  );
  assert.deepEqual(input, copy);
});
test("E06 empty dataset returns null, never fake activity", async () => {
  assert.equal(recordsCsv([]), null);
  const deps: ExportDependencies = {
    getRecords: async () => [],
    isAvailable: async () => {
      throw Error("must not share");
    },
    writeFile: async () => {
      throw Error("must not write");
    },
    shareFile: async () => {
      throw Error("must not share");
    },
  };
  assert.deepEqual(await exportRecords(deps, row.date), { status: "empty" });
});
test("E08 delimiter escaping, UTF-8 text and future text formula safety", () => {
  assert.equal(csvCell('a,"b"\r\nc'), '"a,""b""\r\nc"');
  assert.equal(csvCell("Wellness ✓"), "Wellness ✓");
  for (const text of ["=1+1", "+SUM(A1)", "-1+2", "@cmd", "  =2", "\tcommand"])
    assert.ok(csvCell(text).startsWith("'"));
  assert.equal(csvCell(8200), "8200");
});
function fake(overrides: Partial<ExportDependencies> = {}) {
  let removed = 0,
    written = "",
    shared = "";
  const file = {
    uri: "file:///test-cache/records.csv",
    remove: () => {
      removed++;
    },
  };
  const deps: ExportDependencies = {
    getRecords: async () => [row],
    isAvailable: async () => true,
    writeFile: async (name, content) => {
      assert.equal(name, "healthmate-records-2026-10-21.csv");
      written = content;
      return file;
    },
    shareFile: async (uri) => {
      shared = uri;
    },
    ...overrides,
  };
  return { deps, file, observed: () => ({ removed, written, shared }) };
}
test("E09 file and database failures surface without sharing", async () => {
  const a = fake({
    writeFile: async () => {
      throw Error("disk full");
    },
  });
  await assert.rejects(() => exportRecords(a.deps, row.date), /disk full/);
  assert.equal(a.observed().shared, "");
  const b = fake({
    getRecords: async () => {
      throw Error("db unavailable");
    },
  });
  await assert.rejects(() => exportRecords(b.deps, row.date), /db unavailable/);
  assert.equal(b.observed().written, "");
});
test("E10 unavailable sharing, native dismissal and share failure cleanup", async () => {
  const a = fake({ isAvailable: async () => false });
  assert.deepEqual(await exportRecords(a.deps, row.date), {
    status: "unavailable",
  });
  assert.equal(a.observed().written, "");
  const b = fake();
  const result = await exportRecords(b.deps, row.date);
  assert.equal(result.status, "closed");
  assert.equal(b.observed().removed, 0);
  if (result.status === "closed") result.file.remove();
  assert.equal(b.observed().removed, 1);
  const c = fake({
    shareFile: async () => {
      throw Error("native failure");
    },
  });
  await assert.rejects(() => exportRecords(c.deps, row.date), /native failure/);
  assert.equal(c.observed().removed, 1);
});
test("E11 real SQLite exports only saved rows and no IDs/goals/summary", async () => {
  const a = sqliteAdapter();
  try {
    await migrateDatabase(a.db);
    const repo = new SQLiteHealthRecordRepository(async () => a.db);
    assert.equal(recordsCsv(await repo.getAllRecords()), null);
    await repo.createRecord({
      date: row.date,
      steps: row.steps,
      calories: row.calories,
      water: row.water,
    });
    const deps = fake({ getRecords: () => repo.getAllRecords() });
    const result = await exportRecords(deps.deps, row.date);
    assert.equal(result.status, "closed");
    assert.equal(
      deps.observed().written,
      header + "2026-10-21,8200,350,2000\r\n",
    );
    assert.equal(deps.observed().shared, deps.file.uri);
  } finally {
    a.close();
  }
});
test("Malformed dates, duplicates, strings and unsafe measurements cannot enter export", () => {
  for (const bad of [
    { ...row, date: "=cmd" },
    { ...row, date: "2026-02-30" },
    { ...row, steps: "8200" },
    { ...row, steps: NaN },
    { ...row, water: -1 },
  ])
    assert.throws(() => recordsCsv([bad as typeof row]));
  assert.throws(() => recordsCsv([row, row]));
});
