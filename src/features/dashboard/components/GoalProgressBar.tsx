import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { goalProgress } from "@/domain/goals/progress";
import { theme } from "@/theme/tokens";
export function GoalProgressBar({
  actual,
  goal,
  unit,
  color,
}: {
  actual: number;
  goal: number | null;
  unit: string;
  color: string;
}) {
  const progress = goalProgress(actual, goal);
  if (progress.status !== "ready")
    return (
      <AppText variant="caption" muted>
        {progress.status === "unset" ? "Goal not set" : "Progress unavailable"}
      </AppText>
    );
  const label = `${progress.percent}%${progress.complete ? " · Target reached" : ""}`;
  return (
    <View style={{ gap: theme.spacing.tiny }}>
      <AppText variant="caption" muted>
        Goal: {goal!.toLocaleString()} {unit}
      </AppText>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${unit} goal progress`}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progress.fill,
          text: label,
        }}
        style={{
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: theme.colors.border,
        }}
      >
        <View
          style={{
            width: `${progress.fill}%`,
            height: "100%",
            backgroundColor: color,
          }}
        />
      </View>
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}
