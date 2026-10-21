import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthGrid,
  selectCalendarDay,
  calendarRecordAction,
} from "../src/domain/calendar/activityCalendar";
import { resolveAddDate } from "../src/domain/calendar/dates";
import { adjacentPeriod, periodFor } from "../src/domain/calendar/periods";
import { sqliteAdapter } from "./sqliteAdapter";
import { migrateDatabase } from "../src/data/database/migrations";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
const today = "2026-10-21",
  row = { id: 17, date: today, steps: 0, calories: 0, water: 0 };
test("C01 October 2026 grid: Thursday start, 31 dates, five rows", () => {
  const grid = monthGrid("2026-10-01");
  assert.equal(grid.length, 5);
  assert.deepEqual(grid[0], [
    null,
    null,
    null,
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
  ]);
  assert.equal(grid.flat().filter(Boolean).length, 31);
  assert.equal(grid[4][5], "2026-10-31");
});
test("C02 leap February and four-row non-leap February", () => {
  const grid = monthGrid("2024-02-01");
  assert.equal(grid[4][3], "2024-02-29");
  assert.equal(grid.flat().filter(Boolean).length, 29);
  assert.equal(monthGrid("2021-02-01").length, 4);
});
test("C03 Sunday/Monday placement and C04 six calendar rows", () => {
  assert.equal(monthGrid("2026-06-01")[0][0], "2026-06-01");
  const grid = monthGrid("2026-03-01");
  assert.equal(grid[0][6], "2026-03-01");
  assert.equal(grid.length, 6);
  assert.equal(grid[5][1], "2026-03-31");
});
test("C05–C07 saved zero is recorded; missing is not a fabricated zero", () => {
  assert.deepEqual(selectCalendarDay([row], today, today), {
    date: today,
    status: "recorded",
    record: row,
  });
  assert.deepEqual(selectCalendarDay([row], "2026-10-20", today), {
    date: "2026-10-20",
    status: "missing",
    record: null,
  });
});
test("C08 edit correct ID, C09 add selected past date, C10 block future", () => {
  assert.deepEqual(
    calendarRecordAction(selectCalendarDay([row], today, today)),
    {
      pathname: "/edit-record/[id]",
      params: { id: "17", returnTo: "calendar" },
    },
  );
  assert.deepEqual(
    calendarRecordAction(selectCalendarDay([], "2026-10-20", today)),
    {
      pathname: "/add-record",
      params: { date: "2026-10-20", returnTo: "calendar" },
    },
  );
  const future = selectCalendarDay(
    [{ ...row, date: "2026-10-22" }],
    "2026-10-22",
    today,
  );
  assert.equal(future.status, "future");
  assert.equal(future.record, null);
  assert.equal(calendarRecordAction(future), null);
});
test("C11 real SQLite create/edit/date-move/delete updates canonical calendar", async () => {
  const a = sqliteAdapter();
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  try {
    await migrateDatabase(a.db);
    const store = createHealthRecordStore(
      new SQLiteHealthRecordRepository(async () => a.db),
    );
    await store.getState().refresh();
    const input = { date: "2024-02-28", steps: 0, calories: 0, water: 0 };
    const r = await store.getState().save(input);
    await tick();
    const day = (date: string) =>
      selectCalendarDay(store.getState().records, date, today);
    assert.equal(day(input.date).record?.id, r.id);
    await store
      .getState()
      .save({ ...input, date: "2024-02-29", steps: 42 }, r.id);
    await tick();
    assert.equal(day(input.date).status, "missing");
    assert.equal(day("2024-02-29").record?.steps, 42);
    await store.getState().remove(r.id);
    await tick();
    assert.equal(day("2024-02-29").status, "missing");
  } finally {
    a.close();
  }
});
test("C12 untrusted navigation date validation", () => {
  assert.equal(resolveAddDate(undefined, today), today);
  assert.equal(resolveAddDate("2024-02-29", today), "2024-02-29");
  for (const date of [
    "",
    [],
    [today],
    [today, today],
    null,
    42,
    "2026-10-22",
    "2023-02-29",
    "2026-1-01",
    "2026-10-20' OR 1=1",
  ])
    assert.equal(resolveAddDate(date, today), null);
});
test("Calendar month navigation clamps future and crosses years correctly", () => {
  const p = periodFor(today, "monthly");
  assert.deepEqual(adjacentPeriod(p, "monthly", 1, today), p);
  assert.equal(
    adjacentPeriod(periodFor("2026-01-01", "monthly"), "monthly", -1, today)
      .start,
    "2025-12-01",
  );
  assert.throws(() => monthGrid("invalid"));
});
