import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyFilters, filterRecords } from "../src/domain/records/search";
const rows = [
  {
    id: 1,
    date: "2026-01-01",
    steps: 0,
    calories: 0,
    water: 0,
    note: "Morning walk 🌿",
    tags: ["Walking"] as ("Walking" | "Yoga")[],
  },
  {
    id: 2,
    date: "2026-01-02",
    steps: 100,
    calories: 20,
    water: 500,
    note: "Yoga, calm",
    tags: ["Walking", "Yoga"] as ("Walking" | "Yoga")[],
  },
];
test("Search inclusive same-day ranges, exact date and deterministic ordering", () => {
  assert.equal(
    filterRecords(rows, {
      ...emptyFilters(),
      start: "2026-01-01",
      end: "2026-01-01",
    })[0].steps,
    0,
  );
  assert.equal(
    filterRecords(rows, { ...emptyFilters(), order: "oldest" })[0].id,
    1,
  );
  assert.equal(filterRecords(rows, emptyFilters(), "2026-01-02")[0].id, 2);
  assert.throws(() =>
    filterRecords(rows, {
      ...emptyFilters(),
      start: "2026-01-03",
      end: "2026-01-01",
    }),
  );
});
test("Search combines numeric, case insensitive notes and all selected tags; clearing restores rows", () => {
  assert.equal(
    filterRecords(rows, { ...emptyFilters(), steps: "0" }).length,
    2,
  );
  assert.equal(
    filterRecords(rows, {
      ...emptyFilters(),
      steps: "100",
      calories: "20",
      water: "500",
      keyword: "YOGA",
      tags: ["Walking", "Yoga"],
    })[0].id,
    2,
  );
  assert.equal(
    filterRecords(rows, { ...emptyFilters(), keyword: "🌿" })[0].id,
    1,
  );
  assert.equal(
    filterRecords(rows, { ...emptyFilters(), water: "501" }).length,
    0,
  );
  assert.equal(filterRecords([...rows, rows[0]], emptyFilters()).length, 2);
  for (const v of ["NaN", "Infinity", "-1", "1.2", "200001"])
    assert.throws(() => filterRecords(rows, { ...emptyFilters(), steps: v }));
});
test("Search re-evaluates edited/deleted/restored collections without retaining stale matches", () => {
  const f = { ...emptyFilters(), keyword: "calm" };
  assert.equal(filterRecords(rows, f).length, 1);
  assert.equal(filterRecords(rows.slice(0, 1), f).length, 0);
  assert.equal(
    filterRecords(
      rows.map((r) => ({ ...r, note: "changed" })),
      f,
    ).length,
    0,
  );
  assert.equal(filterRecords(rows, f).length, 1);
});
test("Search processes a sizeable collection without duplicate result dates", () => {
  const many = Array.from({ length: 20000 }, (_, i) => ({
    ...rows[i % 2],
    id: i + 1,
  }));
  assert.equal(filterRecords(many, emptyFilters()).length, 2);
});
