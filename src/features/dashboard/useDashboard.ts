import { useCallback, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { healthRecordStore, useHealthRecords } from "@/store/healthRecords";
import { localDate } from "@/domain/records/validation";
import { selectDashboard } from "./dashboardSelectors";
import { createDashboardLifecycle } from "./dashboardLifecycle";
export function useDashboard() {
  const [today, setToday] = useState(() => localDate());
  const records = useHealthRecords((s) => s.records),
    hasLoaded = useHealthRecords((s) => s.hasLoaded);
  const loading = useHealthRecords((s) => s.loading),
    mutating = useHealthRecords((s) => s.mutating),
    error = useHealthRecords((s) => s.error);
  useFocusEffect(
    useCallback(() => {
      const lifecycle = createDashboardLifecycle({
        now: () => new Date(),
        onDate: setToday,
        refresh: () => healthRecordStore.getState().refresh(),
        schedule: (callback, delay) => {
          const timer = setTimeout(callback, delay);
          return () => clearTimeout(timer);
        },
      });
      if (AppState.currentState === "active" || AppState.currentState === null)
        lifecycle.activate();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") lifecycle.activate();
        else lifecycle.suspend();
      });
      return () => {
        lifecycle.suspend();
        subscription.remove();
      };
    }, []),
  );
  return {
    today,
    summary: selectDashboard(
      { records, hasLoaded, loading, mutating, error },
      today,
    ),
    retry: () => {
      void healthRecordStore.getState().refresh();
    },
  };
}
