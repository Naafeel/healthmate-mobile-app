import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  adjacentPeriod,
  analyticsState,
  calculateAnalytics,
  periodFor,
} from "../src/features/insights/analytics";
import type { HealthRecord } from "../src/domain/models/HealthRecord";
import { sqliteAdapter } from "./sqliteAdapter";
import { migrateDatabase } from "../src/data/database/migrations";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
const today = "2024-03-03",
  period = periodFor(today, "weekly");
const rows: HealthRecord[] = [
  { id: 1, date: "2024-02-26", steps: 5000, calories: 100, water: 1000 },
  { id: 2, date: "2024-02-28", steps: 7000, calories: 200, water: 2000 },
  { id: 3, date: "2024-02-29", steps: 0, calories: 0, water: 0 },
];
test("I01 Monday–Sunday weeks including year crossover", () => {
  for (const date of ["2024-02-26", "2024-03-03"])
    assert.deepEqual(periodFor(date, "weekly"), {
      start: "2024-02-26",
      end: "2024-03-03",
    });
  assert.deepEqual(periodFor("2025-01-01", "weekly"), {
    start: "2024-12-30",
    end: "2025-01-05",
  });
});
test("I02 monthly calendar boundaries and December rollover", () => {
  assert.deepEqual(periodFor("2024-04-15", "monthly"), {
    start: "2024-04-01",
    end: "2024-04-30",
  });
  assert.deepEqual(periodFor("2024-12-31", "monthly"), {
    start: "2024-12-01",
    end: "2024-12-31",
  });
});
test("I03 leap-year February produces all 29 positions", () => {
  const p = periodFor("2024-02-29", "monthly");
  assert.equal(p.end, "2024-02-29");
  assert.equal(calculateAnalytics(rows, "steps", p, today).days.length, 29);
  assert.equal(periodFor("2023-02-20", "monthly").end, "2023-02-28");
});
test("I04 exact metric totals without mixed units", () => {
  assert.equal(calculateAnalytics(rows, "steps", period, today).total, 12000);
  assert.equal(calculateAnalytics(rows, "calories", period, today).total, 300);
  assert.equal(calculateAnalytics(rows, "water", period, today).total, 3000);
});
test("I05 average denominator includes recorded zero but not missing days", () => {
  const r = calculateAnalytics(rows, "steps", period, today);
  assert.equal(r.average, 4000);
  assert.equal(r.count, 3);
  assert.equal(
    calculateAnalytics(rows.slice(0, 2), "steps", period, today).average,
    6000,
  );
});
test("I06 saved zero differs from missing; all-zero period has real zero statistics", () => {
  const r = calculateAnalytics(rows, "steps", period, today);
  assert.deepEqual(r.days[1], {
    date: "2024-02-27",
    status: "missing",
    value: null,
  });
  assert.deepEqual(r.days[3], {
    date: "2024-02-29",
    status: "recorded",
    value: 0,
  });
  const zero = calculateAnalytics([rows[2]], "steps", period, today);
  assert.equal(zero.total, 0);
  assert.equal(zero.average, 0);
  assert.equal(zero.count, 1);
  assert.equal(zero.highest?.value, 0);
});
test("I07 highest date uses earliest date for ties independent of row order", () => {
  const r = calculateAnalytics(
    [...rows, { ...rows[0], id: 4, date: "2024-03-01", steps: 7000 }].reverse(),
    "steps",
    period,
    today,
  );
  assert.deepEqual(r.highest, { date: "2024-02-28", value: 7000 });
});
test("I08 empty statistics are null without NaN or fake zero observations", () => {
  const r = calculateAnalytics([], "steps", period, today);
  assert.equal(r.count, 0);
  assert.equal(r.total, null);
  assert.equal(r.average, null);
  assert.equal(r.highest, null);
  assert.ok(r.days.every((d) => d.status === "missing"));
});
test("I09 chronological chart positions preserve canonical order", () => {
  const input = [...rows].reverse(),
    original = [...input];
  const r = calculateAnalytics(input, "steps", period, today);
  assert.deepEqual(
    r.days.map((d) => d.date),
    [
      "2024-02-26",
      "2024-02-27",
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
      "2024-03-02",
      "2024-03-03",
    ],
  );
  assert.deepEqual(input, original);
});
test("I10 previous/next period and upper clamp to current period", () => {
  const previous = adjacentPeriod(period, "weekly", -1, today);
  assert.equal(previous.start, "2024-02-19");
  assert.deepEqual(adjacentPeriod(previous, "weekly", 1, today), period);
  assert.deepEqual(adjacentPeriod(period, "weekly", 1, today), period);
  const month = periodFor("2024-01-01", "monthly");
  assert.equal(adjacentPeriod(month, "monthly", -1, today).start, "2023-12-01");
  assert.equal(adjacentPeriod(month, "monthly", 1, today).end, "2024-02-29");
});
test("I11 local timezone boundaries remain stable in Colombo, Honolulu and DST", () => {
  for (const zone of ["Asia/Colombo", "Pacific/Honolulu", "America/New_York"]) {
    const result = execFileSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "-e",
        `const {localDate}=require('./src/domain/records/validation.ts');const {periodFor}=require('./src/features/insights/analytics.ts');const date=localDate(new Date(2024,2,10,0,5));console.log(JSON.stringify(periodFor(date,'weekly')));`,
      ],
      { env: { ...process.env, TZ: zone }, encoding: "utf8" },
    ).trim();
    assert.deepEqual(JSON.parse(result), {
      start: "2024-03-04",
      end: "2024-03-10",
    });
  }
});
test("I12 real SQLite CRUD immediately updates analytics from canonical state", async () => {
  const a = sqliteAdapter();
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  try {
    await migrateDatabase(a.db);
    const store = createHealthRecordStore(
      new SQLiteHealthRecordRepository(async () => a.db),
    );
    await store.getState().refresh();
    const input = { date: rows[0].date, steps: 10, calories: 20, water: 30 };
    const saved = await store.getState().save(input);
    await tick();
    const result = () =>
      calculateAnalytics(store.getState().records, "steps", period, today);
    assert.equal(result().total, 10);
    await store.getState().save({ ...input, steps: 25 }, saved.id);
    await tick();
    assert.equal(result().total, 25);
    await store.getState().remove(saved.id);
    await tick();
    assert.equal(result().count, 0);
  } finally {
    a.close();
  }
});
test("I13 invalid/unavailable data reports error instead of false empty", async () => {
  assert.equal(
    analyticsState([], "steps", period, today, false, null).status,
    "loading",
  );
  assert.equal(
    analyticsState([], "steps", period, today, true, "Storage unavailable")
      .status,
    "error",
  );
  for (const bad of [
    { ...rows[0], steps: NaN },
    { ...rows[0], steps: -1 },
    { ...rows[0], date: "2024-02-30" },
  ])
    assert.equal(
      analyticsState([bad], "steps", period, today, true, null).status,
      "error",
    );
  assert.throws(() =>
    calculateAnalytics([rows[0], rows[0]], "steps", period, today),
  );
  assert.throws(() => periodFor("bad", "weekly"));
  const store = createHealthRecordStore(
    new SQLiteHealthRecordRepository(async () => {
      throw Error("offline disk");
    }),
  );
  await store.getState().refresh();
  assert.equal(
    analyticsState(
      store.getState().records,
      "steps",
      period,
      today,
      store.getState().hasLoaded,
      store.getState().error,
    ).status,
    "error",
  );
});
test("I14 future dates have null values and never contribute even if input contains a future row", () => {
  const r = calculateAnalytics(
    [...rows, { ...rows[0], id: 4, date: "2024-03-01", steps: 999 }],
    "steps",
    period,
    "2024-02-29",
  );
  assert.equal(r.total, 12000);
  assert.equal(r.count, 3);
  assert.ok(
    r.days.slice(4).every((d) => d.status === "future" && d.value === null),
  );
});
