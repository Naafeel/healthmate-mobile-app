import { test } from "node:test";
import assert from "node:assert/strict";
import {
  weeklySummary,
  shareSummary,
} from "../src/domain/sharing/weeklySummary";
import { shiftDay } from "../src/domain/calendar/dates";
const row = {
  id: 1,
  date: "2026-01-01",
  steps: 10,
  calories: 5,
  water: 500,
  note: "Private",
  tags: ["Yoga"] as const,
};
test("Weekly summary distinguishes no rows, saved zeros and missing dates across year boundary", () => {
  const empty = weeklySummary([], "2026-01-01");
  assert.equal(empty.period.start, "2025-12-29");
  assert.equal(empty.period.end, "2026-01-04");
  assert.equal(empty.metrics[0].average, null);
  const zero = weeklySummary([{ ...row, steps: 0, tags: [] }], "2026-01-01");
  assert.equal(zero.days, 1);
  assert.equal(zero.metrics[0].average, 0);
  assert.ok(zero.text.includes("1 of 7"));
  assert.ok(zero.text.includes("through 2026-01-01"));
  assert.ok(!zero.text.includes("Private"));
  assert.ok(!zero.text.includes("Yoga"));
});
test("Previous complete week and per-recorded-day averages use only selected actual records", () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({
    ...row,
    id: i + 1,
    date: shiftDay("2025-12-22", i),
    tags: [],
  }));
  const result = weeklySummary(rows, "2026-01-01", true);
  assert.equal(result.days, 7);
  assert.equal(result.metrics[0].total, 70);
  assert.equal(result.metrics[2].average, 500);
  assert.ok(result.text.includes("Completed Monday–Sunday"));
});
test("Weekly summaries refresh from canonical changes and deduplicate dates", () => {
  assert.equal(
    weeklySummary(
      [
        { ...row, tags: [] },
        { ...row, tags: [] },
      ],
      "2026-01-01",
    ).days,
    1,
  );
  assert.equal(
    weeklySummary([{ ...row, steps: 20, tags: [] }], "2026-01-01").metrics[0]
      .total,
    20,
  );
  assert.equal(weeklySummary([], "2026-01-01").days, 0);
});
test("Summary shares exact preview and cancellation never claims delivery", async () => {
  const text = weeklySummary([], "2026-01-01").text;
  assert.match(
    await shareSummary(text, async (sent) => {
      assert.equal(sent, text);
      return "cancelled";
    }),
    /cancelled/,
  );
  assert.match(
    await shareSummary(text, async () => "closed"),
    /cannot confirm delivery/,
  );
});
