import type { WaterIncrementRepository } from "../domain/records/quickWater";
import { createStore } from "zustand/vanilla";
import type {
  HealthRecord,
  CreateHealthRecord,
} from "../domain/models/HealthRecord";
import type { HealthRecordRepository } from "../domain/repositories/HealthRecordRepository";
import {
  RecordError,
  recordErrorMessage,
} from "../domain/records/recordErrors";
export interface HealthRecordState {
  records: HealthRecord[];
  loading: boolean;
  hasLoaded: boolean;
  mutating: boolean;
  error: string | null;
  success: string | null;
  refresh(): Promise<void>;
  save(input: CreateHealthRecord, id?: number): Promise<HealthRecord>;
  remove(id: number): Promise<boolean>;
  replaceFromStorage(records: HealthRecord[]): void;
  clearFeedback(): void;
  addWater(date: string, amount: number): Promise<boolean>;
}
const sorted = (records: HealthRecord[]) =>
  [...records].sort((a, b) => b.date.localeCompare(a.date));
export function createHealthRecordStore(
  repository: HealthRecordRepository & Partial<WaterIncrementRepository>,
) {
  let revision = 0;
  return createStore<HealthRecordState>()((set, get) => ({
    replaceFromStorage: (records) => {
      revision++;
      set({
        records: sorted(records),
        hasLoaded: true,
        error: null,
        success: null,
      });
    },
    records: [],
    loading: false,
    hasLoaded: false,
    mutating: false,
    error: null,
    success: null,
    clearFeedback: () => set({ error: null, success: null }),
    refresh: async () => {
      if (get().loading || get().mutating) return;
      const started = revision;
      set({ loading: true, error: null });
      try {
        const records = await repository.getAllRecords();
        if (started === revision) set({ records, hasLoaded: true });
      } catch (error) {
        if (started === revision) set({ error: recordErrorMessage(error) });
      } finally {
        set({ loading: false });
        if (started !== revision && !get().mutating) void get().refresh();
      }
    },
    save: async (input, id) => {
      if (get().mutating)
        throw new RecordError(
          "busy",
          "A record change is already being saved. Please wait.",
        );
      revision++;
      let changed = false;
      set({ mutating: true, error: null, success: null });
      try {
        const record =
          id === undefined
            ? await repository.createRecord(input)
            : await repository.updateRecord(id, input);
        set((state) => ({
          records: sorted([
            ...state.records.filter((r) => r.id !== record.id),
            record,
          ]),
          success:
            id === undefined
              ? "Record saved on this device."
              : "Record updated on this device.",
        }));
        changed = true;
        return record;
      } catch (error) {
        set({ error: recordErrorMessage(error) });
        throw error;
      } finally {
        set({ mutating: false });
        if (changed) void get().refresh();
      }
    },
    addWater: async (date, amount) => {
      if (get().mutating) return false;
      revision++;
      let changed = false;
      set({ mutating: true, error: null, success: null });
      try {
        if (!repository.incrementWater)
          throw new Error("Water update unavailable");
        const record = await repository.incrementWater(date, amount);
        set((state) => ({
          records: sorted([
            ...state.records.filter((r) => r.id !== record.id),
            record,
          ]),
          success: amount + " ml water added.",
        }));
        changed = true;
        return true;
      } catch (e) {
        set({ error: recordErrorMessage(e) });
        return false;
      } finally {
        set({ mutating: false });
        if (changed) void get().refresh();
      }
    },
    remove: async (id) => {
      if (get().mutating) return false;
      revision++;
      let changed = false;
      set({ mutating: true, error: null, success: null });
      try {
        await repository.deleteRecord(id);
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
          success: "Record deleted from this device.",
        }));
        changed = true;
        return true;
      } catch (error) {
        set({ error: recordErrorMessage(error) });
        return false;
      } finally {
        set({ mutating: false });
        if (changed) void get().refresh();
      }
    },
  }));
}
