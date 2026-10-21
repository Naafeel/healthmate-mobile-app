import { test } from "node:test";
import assert from "node:assert/strict";
import { sqliteAdapter } from "./sqliteAdapter";
import { initializeDatabase } from "../src/data/database/preferencesMigration";
import { SQLitePreferencesRepository } from "../src/data/repositories/SQLitePreferencesRepository";
import {
  defaultPreferences,
  resolveTheme,
  validatePreferences,
} from "../src/domain/preferences/preferences";
import { theme, darkTheme } from "../src/theme/tokens";
import { createHealthRecordsSQL } from "../src/data/database/migrations";
import { createHealthGoalsSQL } from "../src/data/database/goalsMigration";

test("T01 system follows OS while explicit appearance remains fixed", () => {
  assert.equal(resolveTheme("system", "dark"), "dark");
  assert.equal(resolveTheme("system", "light"), "light");
  assert.equal(resolveTheme("system", null), "light");
  assert.equal(resolveTheme("light", "dark"), "light");
  assert.equal(resolveTheme("dark", "light"), "dark");
});
test("T02 v2 upgrade and reopening preserve records/goals and persist preference settings", async () => {
  const a = sqliteAdapter();
  try {
    await a.db.execAsync(
      createHealthRecordsSQL +
        createHealthGoalsSQL +
        "PRAGMA user_version=2; INSERT INTO health_records(date,steps,calories,water) VALUES('2026-10-21',7850,400,2500);",
    );
    await initializeDatabase(a.db);
    const repo = new SQLitePreferencesRepository(async () => a.db);
    assert.deepEqual(await repo.get(), defaultPreferences);
    await repo.save({ ...defaultPreferences, theme: "dark" });
    await initializeDatabase(a.db);
    assert.equal((await repo.get()).theme, "dark");
    assert.equal(
      (
        await a.db.getFirstAsync<{ steps: number }>(
          "SELECT steps FROM health_records",
        )
      )?.steps,
      7850,
    );
    assert.equal(
      (
        await a.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      3,
    );
  } finally {
    a.close();
  }
});
test("T03 fresh v3 has no seeded activity; future schema rejects without mutation", async () => {
  const a = sqliteAdapter();
  try {
    await initializeDatabase(a.db);
    assert.deepEqual(
      await a.db.getAllAsync("SELECT * FROM health_records"),
      [],
    );
    await a.db.execAsync("PRAGMA user_version=4");
    await assert.rejects(() => initializeDatabase(a.db));
  } finally {
    a.close();
  }
});
test("T04 preferences reject invalid modes/time and unexpected fields", () => {
  for (const p of [
    { ...defaultPreferences, theme: "blue" },
    { ...defaultPreferences, reminderHour: 24 },
    { ...defaultPreferences, reminderMinute: -1 },
    { ...defaultPreferences, reminderEnabled: 1 },
    { ...defaultPreferences, extra: true },
  ])
    assert.throws(() => validatePreferences(p));
});
function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test("T05 both palettes maintain AA text, button and metric contrast", () => {
  for (const t of [theme, darkTheme]) {
    for (const bg of [t.colors.background, t.colors.surface])
      for (const fg of [t.colors.text, t.colors.muted, t.colors.error])
        assert.ok(contrast(fg, bg) >= 4.5, fg + " / " + bg);
    assert.ok(contrast(t.colors.primary, t.colors.onPrimary) >= 4.5);
    assert.ok(contrast(t.colors.disabledText, t.colors.disabled) >= 4.5);
    for (const m of Object.values(t.metrics))
      assert.ok(contrast(m.foreground, m.background) >= 4.5);
  }
});
