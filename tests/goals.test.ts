import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { sqliteAdapter } from "./sqliteAdapter";
import {
  createHealthRecordsSQL,
  migrateDatabase,
} from "../src/data/database/migrations";
import { SQLiteHealthGoalRepository } from "../src/data/repositories/SQLiteHealthGoalRepository";
import {
  validateGoalFields,
  validateGoals,
} from "../src/domain/goals/validation";
import { goalProgress } from "../src/domain/goals/progress";
import {
  emptyGoals,
  type GoalValues,
  type HealthGoals,
} from "../src/domain/models/HealthGoals";
import { createHealthGoalStore } from "../src/store/createHealthGoalStore";
const values: GoalValues = { steps: 10000, calories: 500, water: 2500 };
const now = () => new Date("2024-03-01T12:00:00Z");
async function setup() {
  const adapter = sqliteAdapter();
  await migrateDatabase(adapter.db);
  return {
    ...adapter,
    repo: new SQLiteHealthGoalRepository(async () => adapter.db, now),
  };
}
test("G01 valid goals save through real SQLite and retain timestamp", async () => {
  const a = await setup();
  try {
    const saved = await a.repo.saveGoals(values);
    assert.deepEqual(saved, { ...values, updatedAt: now().toISOString() });
    assert.deepEqual(await a.repo.getGoals(), saved);
  } finally {
    a.close();
  }
});
test("G02 domain/form/SQL reject invalid goals and singleton violations", async () => {
  const a = await setup();
  try {
    for (const value of [0, -1, 1.5, NaN, Infinity, 200001, "12", undefined])
      assert.throws(() => validateGoals({ ...values, steps: value as number }));
    for (const text of ["0", "-1", "1.5", "abc", "Infinity", "1e3", "200001"])
      assert.ok(
        validateGoalFields({ steps: text, calories: "", water: "" }).errors
          .steps,
      );
    for (const value of [0, -1, 1.5, 200001, "oops"])
      await assert.rejects(() =>
        a.db.runAsync(
          "INSERT INTO health_goals(id,steps_goal,updated_at) VALUES(1,?,?)",
          value,
          "test",
        ),
      );
    await assert.rejects(() =>
      a.db.runAsync(
        "INSERT INTO health_goals(id,updated_at) VALUES(2,?)",
        "test",
      ),
    );
    for (const key of ["calories", "water"] as const) {
      assert.throws(() => validateGoals({ ...values, [key]: 20001 }));
      await assert.rejects(() =>
        a.db.runAsync(
          `INSERT INTO health_goals(id,${key}_goal,updated_at) VALUES(1,?,?)`,
          20001,
          "test",
        ),
      );
    }
  } finally {
    a.close();
  }
});
test("G03 partial goals and whitespace blanks are unset", async () => {
  const a = await setup();
  try {
    const result = validateGoalFields({
      steps: " 42 ",
      calories: "",
      water: "  ",
    });
    assert.deepEqual(result.input, { steps: 42, calories: null, water: null });
    await a.repo.saveGoals(result.input!);
    assert.equal((await a.repo.getGoals()).calories, null);
  } finally {
    a.close();
  }
});
test("G04 update upserts one row without duplication", async () => {
  const a = await setup();
  try {
    await a.repo.saveGoals(values);
    await a.repo.saveGoals({ ...values, steps: 15000 });
    assert.equal((await a.repo.getGoals()).steps, 15000);
    assert.equal(
      (
        await a.db.getFirstAsync<{ n: number }>(
          "SELECT count(*) n FROM health_goals",
        )
      )?.n,
      1,
    );
  } finally {
    a.close();
  }
});
test("G05 clear individual and all configured goals", async () => {
  const a = await setup();
  try {
    await a.repo.saveGoals(values);
    await a.repo.saveGoals({ ...values, water: null });
    assert.deepEqual(await a.repo.getGoals(), {
      ...values,
      water: null,
      updatedAt: now().toISOString(),
    });
    await a.repo.saveGoals(emptyGoals);
    assert.equal((await a.repo.getGoals()).steps, null);
  } finally {
    a.close();
  }
});
test("G06 goals survive database close/reopen", async () => {
  const folder = mkdtempSync(join(tmpdir(), "healthmate-goals-"));
  let a = sqliteAdapter(join(folder, "db.sqlite"));
  try {
    await migrateDatabase(a.db);
    const expected = await new SQLiteHealthGoalRepository(
      async () => a.db,
    ).saveGoals(values);
    a.close();
    a = sqliteAdapter(join(folder, "db.sqlite"));
    await migrateDatabase(a.db);
    assert.deepEqual(
      await new SQLiteHealthGoalRepository(async () => a.db).getGoals(),
      expected,
    );
  } finally {
    a.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
test("G07 upgrade genuine v1 preserves every existing record and ID", async () => {
  const a = sqliteAdapter();
  try {
    await a.db.execAsync(createHealthRecordsSQL + "PRAGMA user_version=1;");
    await a.db.runAsync(
      "INSERT INTO health_records(id,date,steps,calories,water) VALUES(19,'2024-02-29',8200,350,2000)",
    );
    const before = await a.db.getAllAsync("SELECT * FROM health_records");
    await migrateDatabase(a.db);
    assert.deepEqual(
      await a.db.getAllAsync("SELECT * FROM health_records"),
      before,
    );
    assert.deepEqual(
      await new SQLiteHealthGoalRepository(async () => a.db).getGoals(),
      emptyGoals,
    );
  } finally {
    a.close();
  }
});
test("G08 fresh database reaches v2 without seeded activity or goals", async () => {
  const a = await setup();
  try {
    assert.equal(
      (
        await a.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      2,
    );
    assert.deepEqual(await a.repo.getGoals(), emptyGoals);
    assert.deepEqual(
      await a.db.getAllAsync("SELECT * FROM health_records"),
      [],
    );
  } finally {
    a.close();
  }
});
test("G09 repeated migration retains goals, future schema rejects, failed v2 rolls back", async () => {
  const a = await setup();
  try {
    const saved = await a.repo.saveGoals(values);
    await migrateDatabase(a.db);
    assert.deepEqual(await a.repo.getGoals(), saved);
    await a.db.execAsync("PRAGMA user_version=3");
    await assert.rejects(() => migrateDatabase(a.db));
    assert.deepEqual(await a.repo.getGoals(), saved);
  } finally {
    a.close();
  }
  const b = sqliteAdapter();
  try {
    const failing = {
      ...b.db,
      execAsync: async (sql: string) => {
        if (sql.includes("CREATE TABLE IF NOT EXISTS health_goals"))
          throw Error("disk full");
        await b.db.execAsync(sql);
      },
    };
    await assert.rejects(() => migrateDatabase(failing));
    assert.equal(
      (
        await b.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      0,
    );
    assert.equal(
      await b.db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE name='health_records'",
      ),
      null,
    );
    await migrateDatabase(b.db);
  } finally {
    b.close();
  }
});
test("G10 storage load/save failure preserves drafts and retries successfully", async () => {
  const a = await setup();
  let available = false;
  try {
    const repo = new SQLiteHealthGoalRepository(async () => {
      if (!available) throw Error("secret failure");
      return a.db;
    });
    const store = createHealthGoalStore(repo);
    await store.getState().refresh();
    assert.equal(store.getState().hasLoaded, false);
    assert.match(store.getState().error!, /retry/);
    assert.equal(await store.getState().save(values), false);
    assert.equal(store.getState().saving, false);
    available = true;
    await store.getState().refresh();
    assert.equal(store.getState().error, null);
    assert.equal(await store.getState().save(values), true);
    assert.deepEqual(await repo.getGoals(), store.getState().goals);
  } finally {
    a.close();
  }
});
test("G11 stale loads cannot replace saves and repeated saves are guarded", async () => {
  let releaseLoad!: (g: HealthGoals) => void,
    releaseSave!: (g: HealthGoals) => void;
  const store = createHealthGoalStore({
    getGoals: () =>
      new Promise((resolve) => {
        releaseLoad = resolve;
      }),
    saveGoals: () =>
      new Promise((resolve) => {
        releaseSave = resolve;
      }),
  });
  const load = store.getState().refresh();
  await store.getState().refresh();
  const save = store.getState().save(values);
  assert.equal(await store.getState().save(values), false);
  releaseSave({ ...values, updatedAt: "saved" });
  assert.equal(await save, true);
  releaseLoad(emptyGoals);
  await load;
  assert.equal(store.getState().goals.steps, 10000);
  assert.equal(store.getState().loading, false);
});
test("P01–P07 progress below/equal/above/zero/missing/unset and rounding", () => {
  assert.deepEqual(goalProgress(7500, 10000), {
    status: "ready",
    percent: 75,
    fill: 75,
    complete: false,
  });
  assert.deepEqual(goalProgress(2000, 2000), {
    status: "ready",
    percent: 100,
    fill: 100,
    complete: true,
  });
  assert.deepEqual(goalProgress(2500, 2000), {
    status: "ready",
    percent: 125,
    fill: 100,
    complete: true,
  });
  assert.deepEqual(goalProgress(0, 100), {
    status: "ready",
    percent: 0,
    fill: 0,
    complete: false,
  });
  assert.deepEqual(goalProgress(null, 100), { status: "missing" });
  assert.deepEqual(goalProgress(0, null), { status: "unset" });
  assert.equal((goalProgress(1, 3) as { percent: number }).percent, 33.3);
  for (const goal of [0, -1, Infinity, NaN, 0.5])
    assert.deepEqual(goalProgress(1, goal), { status: "invalid" });
  assert.deepEqual(goalProgress(NaN, 10), { status: "invalid" });
  const almost = goalProgress(199999, 200000);
  assert.ok(
    almost.status === "ready" && almost.percent === 100 && !almost.complete,
  );
});
