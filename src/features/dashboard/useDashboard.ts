import { useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { healthGoalStore } from "@/store/healthGoals";
import { useRecordOverview } from "@/hooks/useRecordOverview";
import { selectDashboard } from "./dashboardSelectors";
import { loggingStreaks } from "@/domain/records/loggingStreaks";
export function useDashboard() {
  const state = useRecordOverview();
  const streaks = useMemo(() => {
    try {
      return loggingStreaks(
        state.records.map((row) => row.date),
        state.today,
      );
    } catch {
      return null;
    }
  }, [state.records, state.today]);
  useFocusEffect(
    useCallback(() => {
      void healthGoalStore.getState().refresh();
    }, []),
  );
  return {
    today: state.today,
    summary: selectDashboard(state, state.today),
    retry: state.retry,
    streaks,
  };
}
