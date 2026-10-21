export const widgetIds = [
  "steps",
  "calories",
  "water",
  "goals",
  "streak",
  "quickWater",
] as const;
export type WidgetId = (typeof widgetIds)[number];
export interface Widget {
  id: WidgetId;
  visible: boolean;
}
export const defaultLayout = (): Widget[] =>
  widgetIds.map((id) => ({ id, visible: true }));
export function validateLayout(value: unknown): Widget[] {
  if (!Array.isArray(value) || value.length > 50)
    throw new Error("Invalid dashboard layout.");
  const seen = new Set<string>();
  const result: Widget[] = [];
  for (const w of value) {
    if (
      !w ||
      typeof w !== "object" ||
      typeof w.id !== "string" ||
      typeof w.visible !== "boolean" ||
      Object.keys(w).sort().join(",") !== "id,visible" ||
      seen.has(w.id)
    )
      throw new Error("Invalid or duplicate dashboard section.");
    seen.add(w.id);
    if (widgetIds.includes(w.id)) result.push({ id: w.id, visible: w.visible });
  }
  return [...result, ...defaultLayout().filter((w) => !seen.has(w.id))];
}
export function moveWidget(layout: Widget[], id: WidgetId, delta: -1 | 1) {
  const result = layout.map((w) => ({ ...w }));
  const i = result.findIndex((w) => w.id === id),
    j = i + delta;
  if (i >= 0 && j >= 0 && j < result.length)
    [result[i], result[j]] = [result[j], result[i]];
  return result;
}
