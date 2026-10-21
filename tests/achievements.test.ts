import { test } from "node:test";
import assert from "node:assert/strict";
import { achievements } from "../src/domain/achievements/achievements";
import { shiftDay } from "../src/domain/calendar/dates";
const goals = { steps: 10, calories: null, water: 20 };
function rows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    date: shiftDay("2025-12-01", i),
    steps: 0,
    calories: 0,
    water: 0,
  }));
}
for (const n of [0, 1, 3, 7, 30, 50, 100])
  test(`Badges calculate ${n} distinct saved zero dates`, () => {
    const result = achievements(rows(n), goals, "2026-10-21");
    assert.equal(result[0].unlocked, n > 0);
    assert.equal(result[2].unlocked, n >= 7);
    assert.equal(result[5].unlocked, n >= 100);
    assert.equal(new Set(result.map((b) => b.id)).size, 8);
  });
test("Badges deduplicate, exclude future, reflect deletion and current goal changes", () => {
  const records = rows(7);
  records[0].steps = 10;
  records[0].water = 20;
  assert.equal(
    achievements(
      [...records, records[0], { ...records[0], date: "2027-01-01" }],
      goals,
      "2026-10-21",
    )[3].progress,
    7,
  );
  assert.equal(achievements(records, goals, "2026-10-21")[6].unlocked, true);
  assert.equal(
    achievements(records, { ...goals, steps: 11 }, "2026-10-21")[6].unlocked,
    false,
  );
  assert.equal(
    achievements(records.slice(1), goals, "2026-10-21")[2].unlocked,
    false,
  );
});
test("A missing date breaks a run across the year boundary", () => {
  const records = rows(3).map((r, i) => ({
    ...r,
    date: ["2025-12-31", "2026-01-01", "2026-01-03"][i],
  }));
  assert.equal(achievements(records, goals, "2026-01-04")[1].progress, 2);
});
