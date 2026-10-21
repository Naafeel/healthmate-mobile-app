import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeBackup, validateBackup } from "../src/domain/backup/backup";
import { defaultPreferences } from "../src/domain/preferences/preferences";
import { emptyProfile } from "../src/domain/profile/profile";
import { defaultLayout } from "../src/domain/dashboard/layout";
import { shiftDay } from "../src/domain/calendar/dates";
import { weeklySummary } from "../src/domain/sharing/weeklySummary";
import { localDate } from "../src/domain/records/validation";
const backup = () => ({
  format: "healthmate-backup" as const,
  version: 2 as const,
  exportedAt: "2026-01-01T00:00:00.000Z",
  records: [
    {
      date: "2026-01-01",
      steps: 0,
      calories: 0,
      water: 0,
      note: "🌿",
      tags: ["Yoga" as const],
    },
  ],
  goals: { steps: null, calories: null, water: null },
  preferences: { ...defaultPreferences },
  profile: { ...emptyProfile },
  layout: defaultLayout(),
});
test("New backup serialization preserves Unicode and validated tags without retaining mutable references", () => {
  const input = backup(),
    validated = validateBackup(input);
  input.records[0].tags.length = 0;
  assert.deepEqual(validated.records[0].tags, ["Yoga"]);
  const text = serializeBackup(validated);
  assert.equal(JSON.parse(text).records[0].note, "🌿");
});
test("Oversized generated backups are rejected by the same safety bound as imports", () => {
  const b = backup();
  b.records = Array.from({ length: 10000 }, (_, i) => ({
    ...b.records[0],
    date: shiftDay("1960-01-01", i),
    note: "界".repeat(500),
  }));
  assert.throws(() => serializeBackup(b), /5 MB/);
});
test("Weekly selection uses the local calendar date at UTC boundaries; empty totals are unavailable", () => {
  const before = process.env.TZ;
  try {
    process.env.TZ = "Asia/Colombo";
    const date = localDate(new Date("2025-12-28T20:00:00Z"));
    assert.equal(date, "2025-12-29");
    assert.equal(weeklySummary([], date).period.start, "2025-12-29");
    process.env.TZ = "America/Los_Angeles";
    const previous = localDate(new Date("2025-12-29T01:00:00Z"));
    assert.equal(previous, "2025-12-28");
    assert.equal(weeklySummary([], previous).period.start, "2025-12-22");
    assert.ok(weeklySummary([], previous).text.includes("total: Unavailable"));
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
});
