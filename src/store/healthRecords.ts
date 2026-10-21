import { serializeRepository } from "../data/database/access";
import { useStore } from "zustand";
import {
  createHealthRecordStore,
  type HealthRecordState,
} from "./createHealthRecordStore";
import { SQLiteAnnotatedRecordRepository } from "../data/repositories/SQLiteAnnotatedRecordRepository";
import { getDatabase } from "../data/database/database";
export const healthRecordRepository = serializeRepository(
  new SQLiteAnnotatedRecordRepository(getDatabase),
);
export const healthRecordStore = createHealthRecordStore(
  healthRecordRepository,
);
export function useHealthRecords<T>(
  selector: (state: HealthRecordState) => T,
): T {
  return useStore(healthRecordStore, selector);
}
