export interface HealthRecord {
  id: number;
  date: string;
  steps: number;
  calories: number;
  water: number;
}
export type CreateHealthRecord = Omit<HealthRecord, "id">;
/** Updates replace the full daily summary while preserving its ID. */
export type UpdateHealthRecord = CreateHealthRecord;
