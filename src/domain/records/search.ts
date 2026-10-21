import type { HealthRecord } from "../models/HealthRecord";
import { isCalendarDate, measurementLimits } from "./validation";
import { validateAnnotations, type ActivityTag } from "./annotations";
export interface RecordFilters {
  start: string;
  end: string;
  order: "newest" | "oldest";
  steps: string;
  calories: string;
  water: string;
  keyword: string;
  tags: ActivityTag[];
}
export const emptyFilters = (): RecordFilters => ({
  start: "",
  end: "",
  order: "newest",
  steps: "",
  calories: "",
  water: "",
  keyword: "",
  tags: [],
});
export function validateFilters(f: RecordFilters) {
  for (const d of [f.start, f.end])
    if (d && !isCalendarDate(d)) throw new Error("Use valid calendar dates.");
  if (f.start && f.end && f.start > f.end)
    throw new Error("Start date cannot be after end date.");
  if (!["newest", "oldest"].includes(f.order))
    throw new Error("Choose newest or oldest first.");
  for (const k of ["steps", "calories", "water"] as const)
    if (
      f[k] &&
      (!/^\d+$/.test(f[k]) ||
        !Number.isSafeInteger(Number(f[k])) ||
        Number(f[k]) > measurementLimits[k])
    )
      throw new Error(
        `Minimum ${k} must be a whole number between 0 and ${measurementLimits[k]}.`,
      );
  if (typeof f.keyword !== "string" || f.keyword.length > 500)
    throw new Error("Search notes with at most 500 characters.");
  validateAnnotations("", f.tags);
  return f;
}
export function filterRecords(
  records: readonly HealthRecord[],
  filters: RecordFilters,
  exact = "",
) {
  const f = validateFilters(filters),
    keyword = f.keyword.trim().toLocaleLowerCase();
  const unique = new Map<string, HealthRecord>();
  for (const r of records)
    if (
      (!exact || r.date === exact) &&
      (!f.start || r.date >= f.start) &&
      (!f.end || r.date <= f.end) &&
      (["steps", "calories", "water"] as const).every(
        (k) => !f[k] || r[k] >= Number(f[k]),
      ) &&
      (!keyword || (r.note ?? "").toLocaleLowerCase().includes(keyword)) &&
      f.tags.every((t) => r.tags?.includes(t))
    )
      unique.set(r.date, r);
  return [...unique.values()].sort(
    (a, b) =>
      (f.order === "newest" ? -1 : 1) *
      (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id),
  );
}
