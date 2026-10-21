import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { healthGoalStore } from "@/store/healthGoals";
import { useRecordOverview } from "@/hooks/useRecordOverview";
import { selectDashboard } from "./dashboardSelectors";
export function useDashboard() {
  const state = useRecordOverview();
  useFocusEffect(
    useCallback(() => {
      void healthGoalStore.getState().refresh();
    }, []),
  );
  return {
    today: state.today,
    summary: selectDashboard(state, state.today),
    retry: state.retry,
  };
}
