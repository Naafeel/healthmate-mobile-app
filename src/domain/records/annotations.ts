export const activityTags = [
  "Walking",
  "Running",
  "Cycling",
  "Gym",
  "Yoga",
  "Sports",
  "Other",
] as const;
export type ActivityTag = (typeof activityTags)[number];
export function validateAnnotations(
  note: unknown = "",
  tags: unknown = [],
): { note: string; tags: ActivityTag[] } {
  if (typeof note !== "string" || note.length > 500 || note.includes("\u0000"))
    throw new Error(
      "Notes must contain at most 500 characters and no null characters.",
    );
  if (
    !Array.isArray(tags) ||
    tags.length > activityTags.length ||
    tags.some((t) => !activityTags.includes(t)) ||
    new Set(tags).size !== tags.length
  )
    throw new Error("Choose unique supported activity tags.");
  return { note, tags: [...tags].sort() };
}
