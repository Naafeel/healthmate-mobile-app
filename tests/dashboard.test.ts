import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  selectDashboard,
  formatMeasurement,
  formatDashboardDate,
  formatRecentDate,
} from "../src/features/dashboard/dashboardSelectors";
import {
  createDashboardLifecycle,
  millisecondsToNextDay,
} from "../src/features/dashboard/dashboardLifecycle";
import { createHealthRecordStore } from "../src/store/createHealthRecordStore";
import { SQLiteHealthRecordRepository } from "../src/data/repositories/SQLiteHealthRecordRepository";
import { migrateDatabase } from "../src/data/database/migrations";
import { localDate } from "../src/domain/records/validation";
import { sqliteAdapter } from "./sqliteAdapter";
import type { HealthRecord } from "../src/domain/models/HealthRecord";
import type { HealthRecordRepository } from "../src/domain/repositories/HealthRecordRepository";
const today = "2024-02-29";
const row: HealthRecord = {
  id: 17,
  date: today,
  steps: 8200,
  calories: 350,
  water: 2000,
};
const ready = (records: HealthRecord[]) => ({
  records,
  hasLoaded: true,
  loading: false,
  mutating: false,
  error: null,
});
function summary(records: HealthRecord[], date = today) {
  const result = selectDashboard(ready(records), date);
  assert.equal(result.status, "ready");
  if (result.status !== "ready") throw Error("Expected ready summary");
  return result;
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
async function integration() {
  const adapter = sqliteAdapter();
  await migrateDatabase(adapter.db);
  const repository = new SQLiteHealthRecordRepository(async () => adapter.db);
  const store = createHealthRecordStore(repository);
  await store.getState().refresh();
  return { ...adapter, store, repository };
}

test("D01 no record means null today and no fabricated measurements", () => {
  const result = summary([]);
  assert.equal(result.today, null);
  assert.deepEqual(result.recent, []);
  assert.equal(result.action.kind, "add");
});
test("D02 exact saved daily values are selected without summing recent records", () => {
  const result = summary([
    row,
    { ...row, id: 2, date: "2024-02-28", steps: 6000 },
  ]);
  assert.deepEqual(result.today, row);
  assert.equal(result.today?.steps, 8200);
  assert.equal(result.today?.calories, 350);
  assert.equal(result.today?.water, 2000);
});
test("D03 saved zeros remain a record with three zero values", () => {
  const result = summary([{ ...row, steps: 0, calories: 0, water: 0 }]);
  assert.ok(result.today);
  assert.equal(result.today.steps, 0);
  assert.equal(formatMeasurement(result.today.calories, "en-US"), "0");
  assert.equal(formatMeasurement(result.today.water, "en-US"), "0");
  assert.equal(result.action.kind, "edit");
});
test("D04 previous-day records are recent activity, not today", () => {
  const result = summary([row], "2024-03-01");
  assert.equal(result.today, null);
  assert.deepEqual(result.recent, [row]);
  assert.equal(result.action.kind, "add");
  const later = summary([{ ...row, date: "2026-10-21" }], "2026-10-22");
  assert.equal(later.today, null);
  assert.equal(later.recent[0].date, "2026-10-21");
});
test("D05 SQLite create updates the dashboard through the shared store", async () => {
  const db = await integration();
  try {
    const { id: _, ...input } = row;
    const saved = await db.store.getState().save(input);
    await tick();
    const result = selectDashboard(db.store.getState(), today);
    assert.equal(result.status, "ready");
    if (result.status === "ready") assert.deepEqual(result.today, saved);
  } finally {
    db.close();
  }
});
test("D06 SQLite edit replaces dashboard measurements and preserves ID", async () => {
  const db = await integration();
  try {
    const { id: _, ...input } = row;
    const saved = await db.store.getState().save(input);
    await tick();
    await db.store
      .getState()
      .save({ ...input, steps: 9000, water: 2400 }, saved.id);
    await tick();
    const result = selectDashboard(db.store.getState(), today);
    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.today?.id, saved.id);
      assert.equal(result.today?.steps, 9000);
      assert.equal(result.today?.water, 2400);
      assert.equal(result.recent.length, 1);
    }
  } finally {
    db.close();
  }
});
test("D07 SQLite delete returns daily overview to missing, not saved zeros", async () => {
  const db = await integration();
  try {
    const { id: _, ...input } = row;
    const saved = await db.store.getState().save(input);
    await tick();
    await db.store.getState().remove(saved.id);
    await tick();
    const result = selectDashboard(db.store.getState(), today);
    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.today, null);
      assert.equal(result.action.kind, "add");
    }
  } finally {
    db.close();
  }
});
test("D08 recent activity takes newest three without mutating canonical order", () => {
  const dates = ["2024-02-26", "2024-02-29", "2024-02-27", "2024-02-28"];
  const records = dates.map((date, index) => ({ ...row, id: index + 1, date }));
  const result = summary(records);
  assert.deepEqual(
    result.recent.map((r) => r.date),
    ["2024-02-29", "2024-02-28", "2024-02-27"],
  );
  assert.deepEqual(
    records.map((r) => r.date),
    dates,
  );
  assert.equal(summary([row]).recent.length, 1);
});
test("D09 local day and date labels avoid UTC shifts across positive and negative offsets", () => {
  for (const zone of ["Asia/Colombo", "Pacific/Honolulu"]) {
    const output = execFileSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "-e",
        `const {localDate}=require('./src/domain/records/validation.ts'); const {formatRecentDate}=require('./src/features/dashboard/dashboardSelectors.ts'); const d=new Date(2024,1,29,0,5); console.log(localDate(d)+'|'+formatRecentDate(localDate(d),'2024-02-29','en-US'));`,
      ],
      { env: { ...process.env, TZ: zone }, encoding: "utf8" },
    ).trim();
    assert.equal(output, "2024-02-29|Today · Feb 29, 2024", zone);
  }
  assert.equal(formatMeasurement(12345, "en-US"), "12,345");
  assert.equal(
    formatDashboardDate(today, "en-US"),
    "Thursday, February 29, 2024",
  );
  assert.equal(formatRecentDate("2024-02-28", today, "en-US"), "Feb 28, 2024");
});
test("D10 failed database load yields error/retry state instead of false empty", async () => {
  let available = false;
  const adapter = sqliteAdapter();
  try {
    await migrateDatabase(adapter.db);
    const repository = new SQLiteHealthRecordRepository(async () => {
      if (!available) throw Error("test storage failure");
      return adapter.db;
    });
    const store = createHealthRecordStore(repository);
    assert.equal(selectDashboard(store.getState(), today).status, "loading");
    await store.getState().refresh();
    const result = selectDashboard(store.getState(), today);
    assert.equal(result.status, "error");
    if (result.status === "error")
      assert.match(result.message, /device database/);
    assert.equal(store.getState().hasLoaded, false);
    available = true;
    await store.getState().refresh();
    assert.equal(selectDashboard(store.getState(), today).status, "ready");
    assert.equal(store.getState().hasLoaded, true);
  } finally {
    adapter.close();
  }
});
test("D11 Add/Edit action identifies the saved ID, including zero records", () => {
  assert.deepEqual(summary([]).action, {
    kind: "add",
    label: "Add Today's Record",
  });
  assert.deepEqual(summary([row]).action, {
    kind: "edit",
    label: "Edit Today's Record",
    id: 17,
  });
  assert.equal(
    summary([{ ...row, steps: 0, water: 0, calories: 0 }]).action.kind,
    "edit",
  );
});
test("D12 focus/foreground refresh sees real SQLite edits; duplicate activation cannot query-loop", async () => {
  const db = await integration();
  try {
    const { id: _, ...input } = row;
    const saved = await db.repository.createRecord(input);
    let queries = 0;
    let cancelCount = 0;
    const lifecycle = createDashboardLifecycle({
      now: () => new Date(2024, 1, 29, 12),
      onDate: () => {},
      refresh: async () => {
        queries++;
        await db.store.getState().refresh();
      },
      schedule: () => () => {
        cancelCount++;
      },
    });
    lifecycle.activate();
    lifecycle.activate();
    await tick();
    assert.equal(queries, 1);
    assert.equal(selectDashboard(db.store.getState(), today).status, "ready");
    await db.repository.updateRecord(saved.id, { ...input, steps: 777 });
    lifecycle.suspend();
    lifecycle.activate();
    await tick();
    const result = selectDashboard(db.store.getState(), today);
    assert.equal(result.status, "ready");
    if (result.status === "ready") assert.equal(result.today?.steps, 777);
    assert.equal(queries, 2);
    lifecycle.suspend();
    assert.equal(cancelCount, 2);
  } finally {
    db.close();
  }
});
test("D13 initial loading never flashes the no-record state; cached refresh is explicit", () => {
  assert.deepEqual(
    selectDashboard({ ...ready([]), hasLoaded: false, loading: true }, today),
    { status: "loading" },
  );
  const result = selectDashboard({ ...ready([row]), loading: true }, today);
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(result.refreshing, true);
    assert.equal(result.busy, true);
    assert.deepEqual(result.today, row);
  }
});
test("D14 midnight rollover refreshes once, updates local date, and cancels on blur", async () => {
  let now = new Date(2024, 1, 29, 23, 59, 59);
  let scheduled: (() => void) | undefined;
  let delay = 0,
    queries = 0,
    cancelCount = 0;
  const dates: string[] = [];
  const lifecycle = createDashboardLifecycle({
    now: () => now,
    onDate: (date) => dates.push(date),
    refresh: async () => {
      queries++;
    },
    schedule: (cb, ms) => {
      scheduled = cb;
      delay = ms;
      return () => {
        cancelCount++;
      };
    },
  });
  lifecycle.activate();
  assert.equal(delay, 1100);
  assert.deepEqual(dates, ["2024-02-29"]);
  now = new Date(2024, 2, 1, 0, 0, 0, 100);
  scheduled!();
  assert.deepEqual(dates, ["2024-02-29", "2024-03-01"]);
  assert.equal(queries, 2);
  assert.equal(localDate(now), "2024-03-01");
  lifecycle.suspend();
  const previous = queries;
  scheduled!();
  assert.equal(queries, previous);
  assert.equal(cancelCount, 2);
});
test("D15 foreground after background day-change updates date without a timer leak", () => {
  let now = new Date(2024, 1, 29, 12);
  let timers = 0;
  const dates: string[] = [];
  const lifecycle = createDashboardLifecycle({
    now: () => now,
    onDate: (date) => dates.push(date),
    refresh: async () => {},
    schedule: () => {
      timers++;
      return () => {
        timers--;
      };
    },
  });
  lifecycle.activate();
  lifecycle.suspend();
  assert.equal(timers, 0);
  now = new Date(2024, 2, 1, 12);
  lifecycle.activate();
  assert.deepEqual(dates, ["2024-02-29", "2024-03-01"]);
  assert.equal(timers, 1);
  lifecycle.suspend();
  assert.equal(timers, 0);
});
test("D16 local-midnight scheduling handles daylight-saving transitions", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "-e",
      `const {millisecondsToNextDay}=require('./src/features/dashboard/dashboardLifecycle.ts'); console.log(millisecondsToNextDay(new Date(2024,2,10,0))/3600000);`,
    ],
    { env: { ...process.env, TZ: "America/New_York" }, encoding: "utf8" },
  ).trim();
  assert.ok(Math.abs(Number(output) - (23 + 100 / 3600000)) < 0.000001);
  assert.ok(millisecondsToNextDay(new Date(2024, 1, 29, 12)) > 0);
});
test("D17 overlapping refresh requests share the store load guard", async () => {
  const adapter = sqliteAdapter();
  try {
    await migrateDatabase(adapter.db);
    const repository = new SQLiteHealthRecordRepository(async () => adapter.db);
    let count = 0;
    let release!: (records: HealthRecord[]) => void;
    const proxy = new Proxy(repository, {
      get(target, key) {
        if (key === "getAllRecords")
          return () => {
            count++;
            return new Promise<HealthRecord[]>((resolve) => {
              release = resolve;
            });
          };
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as HealthRecordRepository;
    const store = createHealthRecordStore(proxy);
    const first = store.getState().refresh();
    await store.getState().refresh();
    assert.equal(count, 1);
    assert.equal(selectDashboard(store.getState(), today).status, "loading");
    release([]);
    await first;
    assert.equal(selectDashboard(store.getState(), today).status, "ready");
  } finally {
    adapter.close();
  }
});
