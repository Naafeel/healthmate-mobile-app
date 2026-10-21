import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeExpandedDatabase } from "../src/data/database/expandedMigration";
import { initializeDatabase } from "../src/data/database/preferencesMigration";
import { SQLiteAnnotatedRecordRepository } from "../src/data/repositories/SQLiteAnnotatedRecordRepository";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { SQLiteBackupRepository } from "../src/data/backup/SQLiteBackupRepository";
import { validateAnnotations } from "../src/domain/records/annotations";
const input = {
  date: "2026-01-01",
  steps: 0,
  calories: 0,
  water: 0,
  note: 'A walk, "hello"\nසිංහල 🌿',
  tags: ["Walking", "Yoga"] as const,
};
test("v3 upgrade preserves health rows; annotations create/edit/delete cascade and v2 backup roundtrip", async () => {
  const a = sqliteAdapter();
  try {
    await initializeDatabase(a.db);
    const old = await new SQLiteHealthRecordRepository(
      async () => a.db,
    ).createRecord({ date: "2025-12-31", steps: 1, calories: 2, water: 3 });
    await initializeExpandedDatabase(a.db);
    await initializeExpandedDatabase(a.db);
    const r = new SQLiteAnnotatedRecordRepository(async () => a.db);
    assert.equal((await r.getRecordById(old.id))?.steps, 1);
    const saved = await r.createRecord({ ...input, tags: [...input.tags] });
    assert.equal((await r.getRecordById(saved.id))?.note, input.note);
    const backup = new SQLiteBackupRepository(async () => a.db);
    const b = await backup.snapshot();
    assert.equal(b.version, 2);
    await backup.restore(b);
    assert.deepEqual((await backup.snapshot()).records, b.records);
    const row = (await r.getRecordByDate(input.date))!;
    await r.updateRecord(row.id, { ...input, note: "", tags: [] });
    assert.deepEqual((await r.getRecordById(row.id))?.tags, []);
    await r.updateRecord(row.id, { ...input, tags: [...input.tags] });
    await r.deleteRecord(row.id);
    assert.equal(
      (
        await a.db.getFirstAsync<{ n: number }>(
          "SELECT count(*) n FROM record_tags",
        )
      )?.n,
      0,
    );
  } finally {
    a.close();
  }
});
test("Annotation boundaries reject unknown/duplicate tags and oversize notes", () => {
  assert.equal(validateAnnotations("x".repeat(500), []).note.length, 500);
  for (const [n, t] of [
    ["x".repeat(501), []],
    ["", ["Unknown"]],
    ["", ["Yoga", "Yoga"]],
  ])
    assert.throws(() => validateAnnotations(n, t));
});
