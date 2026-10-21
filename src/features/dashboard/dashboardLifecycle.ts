// Preserve the tested dashboard API while sharing lifecycle behavior with Insights.
export {
  createRecordLifecycle as createDashboardLifecycle,
  millisecondsToNextDay,
} from "../../hooks/recordLifecycle";
