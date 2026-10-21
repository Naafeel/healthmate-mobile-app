import type { HealthRecord } from "../../domain/models/HealthRecord";
import { isCalendarDate } from "../../domain/records/validation";
import { recordsCsv } from "../../domain/records/recordCsv";
export interface ExportFile {
  uri: string;
  remove(): void;
}
export interface ExportDependencies {
  getRecords(): Promise<HealthRecord[]>;
  isAvailable(): Promise<boolean>;
  writeFile(name: string, content: string): Promise<ExportFile>;
  shareFile(uri: string): Promise<void>;
}
export type ExportResult =
  | { status: "empty" }
  | { status: "unavailable" }
  | { status: "closed"; file: ExportFile; count: number };
/** One explicit export request. Native APIs cannot tell cancellation from a completed recipient save. */
export async function exportRecords(
  deps: ExportDependencies,
  today: string,
): Promise<ExportResult> {
  if (!isCalendarDate(today)) throw new Error("Invalid export date.");
  const records = await deps.getRecords();
  const csv = recordsCsv(records);
  if (csv === null) return { status: "empty" };
  if (!(await deps.isAvailable())) return { status: "unavailable" };
  const file = await deps.writeFile(`healthmate-records-${today}.csv`, csv);
  try {
    await deps.shareFile(file.uri);
  } catch (error) {
    file.remove();
    throw error;
  }
  return { status: "closed", file, count: records.length };
}
