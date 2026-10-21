import { useCallback, useState } from "react";
import { ActivityIndicator, Keyboard, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { MeasurementField } from "@/components/MeasurementField";
import {
  goalMetrics,
  validateGoalFields,
  type GoalFields,
  type GoalErrors,
} from "@/domain/goals/validation";
import { healthGoalStore, useHealthGoals } from "@/store/healthGoals";
import { theme } from "@/theme/tokens";
const labels = {
  steps: "Daily step target (steps)",
  calories: "Daily calories-burned target (kcal)",
  water: "Daily water-intake target (ml)",
};
export function GoalSettings() {
  const goals = useHealthGoals((s) => s.goals),
    loaded = useHealthGoals((s) => s.hasLoaded);
  const loading = useHealthGoals((s) => s.loading),
    saving = useHealthGoals((s) => s.saving);
  const error = useHealthGoals((s) => s.error),
    success = useHealthGoals((s) => s.success);
  const [draft, setDraft] = useState<GoalFields | null>(null);
  const fields = draft ?? {
    steps: goals.steps?.toString() ?? "",
    calories: goals.calories?.toString() ?? "",
    water: goals.water?.toString() ?? "",
  };
  const [errors, setErrors] = useState<GoalErrors>({});
  useFocusEffect(
    useCallback(() => {
      void healthGoalStore.getState().refresh();
    }, []),
  );
  async function save() {
    Keyboard.dismiss();
    const result = validateGoalFields(fields);
    setErrors(result.errors);
    if (!result.input) return;
    if (await healthGoalStore.getState().save(result.input)) setDraft(null);
  }
  return (
    <AppCard>
      <AppText variant="heading" accessibilityRole="header">
        Daily health goals
      </AppText>
      <AppText muted>
        Choose your own targets. Leave any field blank to turn that goal off.
        These are personal settings, not medical recommendations.
      </AppText>
      {loading && (
        <ActivityIndicator
          accessibilityLabel="Loading saved goals"
          color={theme.colors.primary}
        />
      )}
      {!loaded && !error && <AppText muted>Loading saved goals…</AppText>}
      {loaded &&
        goalMetrics.map((key) => (
          <View key={key} style={{ gap: theme.spacing.small }}>
            <MeasurementField
              optional
              label={labels[key]}
              value={fields[key]}
              error={errors[key]}
              disabled={saving || loading}
              onChange={(value) => {
                setDraft({ ...fields, [key]: value });
                setErrors((e) => ({ ...e, [key]: undefined }));
                healthGoalStore.getState().clearFeedback();
              }}
            />
            <AppButton
              label={`Clear ${key} goal`}
              variant="secondary"
              disabled={saving || loading || !fields[key]}
              onPress={() => {
                setDraft({ ...fields, [key]: "" });
                setErrors((e) => ({ ...e, [key]: undefined }));
                healthGoalStore.getState().clearFeedback();
              }}
            />
          </View>
        ))}
      {error && (
        <AppText
          accessibilityRole="alert"
          style={{ color: theme.colors.error }}
        >
          {error}
        </AppText>
      )}
      {error && (
        <AppButton
          label="Retry loading goals"
          variant="secondary"
          disabled={loading || saving}
          onPress={() => void healthGoalStore.getState().refresh()}
        />
      )}
      {success && <AppText accessibilityLiveRegion="polite">{success}</AppText>}
      {loaded && (
        <AppButton
          label={saving ? "Saving goals…" : "Save goals"}
          icon="checkmark-outline"
          disabled={saving || loading}
          onPress={() => void save()}
        />
      )}
    </AppCard>
  );
}
