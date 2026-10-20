import type {
  CreateHealthRecord,
  HealthRecord,
  UpdateHealthRecord,
} from "../models/HealthRecord";
export interface HealthRecordRepository {
  createRecord(input: CreateHealthRecord): Promise<HealthRecord>;
  getAllRecords(): Promise<HealthRecord[]>;
  getRecordById(id: number): Promise<HealthRecord | null>;
  getRecordByDate(date: string): Promise<HealthRecord | null>;
  updateRecord(id: number, input: UpdateHealthRecord): Promise<HealthRecord>;
  deleteRecord(id: number): Promise<void>;
  getRecordsByDateRange(start: string, end: string): Promise<HealthRecord[]>;
}
