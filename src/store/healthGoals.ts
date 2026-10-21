import { useStore } from "zustand";
import {
  createHealthGoalStore,
  type HealthGoalState,
} from "./createHealthGoalStore";
import { SQLiteHealthGoalRepository } from "../data/repositories/SQLiteHealthGoalRepository";
import { getDatabase } from "../data/database/database";
export const healthGoalStore = createHealthGoalStore(
  new SQLiteHealthGoalRepository(getDatabase),
);
export function useHealthGoals<T>(selector: (state: HealthGoalState) => T): T {
  return useStore(healthGoalStore, selector);
}
