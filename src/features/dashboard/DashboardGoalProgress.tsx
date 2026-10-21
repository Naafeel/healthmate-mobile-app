import { router } from "expo-router";
import { View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { useHealthGoals } from "@/store/healthGoals";
import { useTheme } from "@/theme/useTheme";
import type { HealthRecord } from "@/domain/models/HealthRecord";
import { GoalProgressBar } from "./components/GoalProgressBar";
export function DashboardGoalProgress({
  record,
}: {
  record: HealthRecord | null;
}) {
  const state = useHealthGoals((s) => s);
  const theme = useTheme();
  return (
    <AppCard>
      <AppText variant="heading" accessibilityRole="header">
        Goal Progress
      </AppText>
      {!state.hasLoaded || state.loading ? (
        <AppText muted>Loading daily goals...</AppText>
      ) : state.error ? (
        <AppText accessibilityRole="alert">{state.error}</AppText>
      ) : !record ? (
        <AppText muted>
          Save today’s activity to see progress against your current goals.
        </AppText>
      ) : (
        (["steps", "calories", "water"] as const).map((metric) => (
          <View key={metric} style={{ gap: theme.spacing.tiny }}>
            <AppText variant="label">
              {
                {
                  steps: "Steps",
                  calories: "Calories burned",
                  water: "Water intake",
                }[metric]
              }
            </AppText>
            <GoalProgressBar
              actual={record[metric]}
              goal={state.goals[metric]}
              unit={{ steps: "steps", calories: "kcal", water: "ml" }[metric]}
              color={theme.metrics[metric].foreground}
            />
          </View>
        ))
      )}
      <AppButton
        label="Set or edit daily goals"
        variant="secondary"
        icon="options-outline"
        onPress={() => router.navigate("/(tabs)/settings")}
      />
    </AppCard>
  );
}
