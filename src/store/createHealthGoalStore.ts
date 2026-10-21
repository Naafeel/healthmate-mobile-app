import { useDataMaintenance } from "./dataMaintenance";
import { createStore } from "zustand/vanilla";
import type { GoalValues, HealthGoals } from "../domain/models/HealthGoals";
import { emptyGoals } from "../domain/models/HealthGoals";
import type { HealthGoalRepository } from "../domain/repositories/HealthGoalRepository";
export interface HealthGoalState {
  goals: HealthGoals;
  hasLoaded: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  refresh(): Promise<void>;
  save(input: GoalValues): Promise<boolean>;
  replaceFromStorage(goals: HealthGoals): void;
  clearFeedback(): void;
}
export function createHealthGoalStore(repository: HealthGoalRepository) {
  let revision = 0;
  return createStore<HealthGoalState>()((set, get) => ({
    replaceFromStorage: (goals) => {
      revision++;
      set({ goals, hasLoaded: true, error: null, success: null });
    },
    goals: { ...emptyGoals },
    hasLoaded: false,
    loading: false,
    saving: false,
    error: null,
    success: null,
    clearFeedback: () => set({ error: null, success: null }),
    refresh: async () => {
      if (get().loading || get().saving) return;
      const started = revision;
      set({ loading: true, error: null });
      try {
        const goals = await repository.getGoals();
        if (started === revision) set({ goals, hasLoaded: true });
      } catch {
        if (started === revision)
          set({
            error: "Goals could not be loaded from this device. Please retry.",
          });
      } finally {
        set({ loading: false });
      }
    },
    save: async (input) => {
      if (get().saving || useDataMaintenance.getState().busy) return false;
      revision++;
      set({ saving: true, error: null, success: null });
      try {
        const goals = await repository.saveGoals(input);
        set({ goals, hasLoaded: true, success: "Goals saved on this device." });
        return true;
      } catch {
        set({
          error:
            "Goals could not be saved. Your changes are still here; try saving again.",
        });
        return false;
      } finally {
        set({ saving: false });
      }
    },
  }));
}
