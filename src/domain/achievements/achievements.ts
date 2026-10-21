import type { HealthRecord } from "../models/HealthRecord";
import type { GoalValues } from "../models/HealthGoals";
import { loggingStreaks } from "../records/loggingStreaks";
export function achievements(
  records: readonly HealthRecord[],
  goals: GoalValues,
  today: string,
) {
  const rows = [
    ...new Map(
      records.filter((r) => r.date <= today).map((r) => [r.date, r]),
    ).values(),
  ];
  const streak = loggingStreaks(
    rows.map((r) => r.date),
    today,
  );
  const configured = (["steps", "calories", "water"] as const).filter(
    (k) => goals[k] !== null,
  );
  const goalMet =
    configured.length > 0 &&
    rows.some((r) => configured.every((k) => r[k] >= goals[k]!));
  const waterMet =
    goals.water !== null && rows.some((r) => r.water >= goals.water!);
  const definitions: [string, string, string, number, number][] = [
    ["first", "First Step", "Save a valid daily record.", rows.length, 1],
    [
      "three",
      "Getting Consistent",
      "Reach a three-day logging run.",
      streak.longest,
      3,
    ],
    [
      "seven",
      "Seven-Day Streak",
      "Reach a seven-day logging run.",
      streak.longest,
      7,
    ],
    [
      "thirty",
      "Thirty-Day Commitment",
      "Log 30 distinct dates.",
      rows.length,
      30,
    ],
    ["fifty", "Fifty Recorded Days", "Log 50 distinct dates.", rows.length, 50],
    ["century", "Century Club", "Log 100 distinct dates.", rows.length, 100],
    [
      "goals",
      "Goal Achiever",
      "A saved date meets all currently configured goals.",
      Number(goalMet),
      1,
    ],
    [
      "water",
      "Hydration Goal",
      "A saved date meets your current water goal.",
      Number(waterMet),
      1,
    ],
  ];
  return definitions.map(([id, name, description, value, target]) => ({
    id,
    name,
    description,
    progress: Math.min(value, target),
    target,
    unlocked: value >= target,
  }));
}
