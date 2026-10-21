export type GoalProgress =
  | { status: "missing" | "unset" | "invalid" }
  | { status: "ready"; percent: number; fill: number; complete: boolean };
/** Labels round to one decimal; completion uses exact values, fill alone caps at 100. */
export function goalProgress(
  actual: number | null,
  goal: number | null,
): GoalProgress {
  if (actual === null) return { status: "missing" };
  if (goal === null) return { status: "unset" };
  if (
    !Number.isSafeInteger(actual) ||
    actual < 0 ||
    !Number.isSafeInteger(goal) ||
    goal <= 0
  )
    return { status: "invalid" };
  const percent = Math.round((actual / goal) * 1000) / 10;
  return {
    status: "ready",
    percent,
    fill: Math.min(100, (actual / goal) * 100),
    complete: actual >= goal,
  };
}
