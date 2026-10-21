import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeExpandedDatabase } from "../src/data/database/expandedMigration";
import { SQLitePersonalizationRepository } from "../src/data/repositories/SQLitePersonalizationRepository";
import {
  validateProfile,
  emptyProfile,
  displayWater,
} from "../src/domain/profile/profile";
import {
  validateLayout,
  defaultLayout,
  moveWidget,
} from "../src/domain/dashboard/layout";
import { SQLiteBackupRepository } from "../src/data/backup/SQLiteBackupRepository";
test("Optional profile supports empty/partial/complete, clearing and strict bounded validation", () => {
  assert.deepEqual(validateProfile(emptyProfile), emptyProfile);
  assert.equal(
    validateProfile({ ...emptyProfile, name: " Alex " }).name,
    "Alex",
  );
  for (const patch of [
    { birthYear: 2027 },
    { birthYear: 1899 },
    { birthYear: 2000.5 },
    { height: NaN },
    { height: Infinity },
    { height: -1 },
    { height: 301 },
    { weight: 0 },
    { weight: 701 },
    { name: "x".repeat(61) },
    { waterUnit: "gallon" },
  ])
    assert.throws(() => validateProfile({ ...emptyProfile, ...patch }, 2026));
  for (const patch of [
    { height: 30, weight: 1, birthYear: 1900 },
    { height: 300, weight: 700, birthYear: 2026 },
  ])
    assert.doesNotThrow(() =>
      validateProfile({ ...emptyProfile, ...patch }, 2026),
    );
  assert.equal(displayWater(2500, "L"), "2.5 L");
  assert.equal(displayWater(250, "L"), "0.25 L");
  assert.equal(displayWater(0, "L"), "0 L");
});
test("Layout handles ordering, visibility, missing and unknown IDs without duplicates", () => {
  const initial = defaultLayout();
  assert.equal(moveWidget(initial, "water", -1)[1].id, "water");
  assert.equal(initial[1].id, "calories");
  assert.equal(
    validateLayout([{ id: "water", visible: false }])[0].visible,
    false,
  );
  assert.equal(validateLayout([]).length, 6);
  assert.equal(validateLayout([{ id: "future", visible: true }]).length, 6);
  assert.throws(() => validateLayout([initial[0], initial[0]]));
  assert.throws(() => validateLayout(null));
  assert.throws(() => validateLayout([{ id: "water", visible: "yes" }]));
});
test("SQLite personalization and backup preserve canonical ml, profile and layout; legacy restores use safe defaults", async () => {
  const a = sqliteAdapter();
  try {
    await initializeExpandedDatabase(a.db);
    const p = new SQLitePersonalizationRepository(async () => a.db);
    assert.deepEqual((await p.get()).profile, emptyProfile);
    await p.saveProfile({
      ...emptyProfile,
      name: "Synthetic",
      height: 170.5,
      weight: 65.2,
      waterUnit: "L",
    });
    await p.saveLayout([{ id: "water", visible: false }]);
    const b = new SQLiteBackupRepository(async () => a.db);
    const snapshot = await b.snapshot();
    await p.saveProfile(emptyProfile);
    await b.restore(snapshot);
    assert.equal((await p.get()).profile.name, "Synthetic");
    assert.equal((await p.get()).layout[0].visible, false);
    const { profile: _p, layout: _l, ...legacy } = snapshot;
    await b.restore({ ...legacy, version: 1 });
    assert.deepEqual((await p.get()).profile, emptyProfile);
    assert.deepEqual((await p.get()).layout, defaultLayout());
  } finally {
    a.close();
  }
});
