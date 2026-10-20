export class RecordError extends Error {
  constructor(
    public readonly code:
      "validation" | "duplicate" | "missing" | "storage" | "busy",
    message: string,
    public readonly existingId?: number,
  ) {
    super(message);
    this.name = "RecordError";
  }
}
export function recordErrorMessage(error: unknown): string {
  return error instanceof RecordError
    ? error.message
    : "The device database could not be accessed. Please try again. Your saved records have not been cleared.";
}
