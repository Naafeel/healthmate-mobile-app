/** Reject repeated query parameters instead of coercing arrays into a valid record ID. */
export function recordRouteId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
