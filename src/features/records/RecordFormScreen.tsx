import { ActivityIndicator, Keyboard } from "react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { DateField } from "@/components/DateField";
import { MeasurementField } from "@/components/MeasurementField";
import { useRecordForm } from "./useRecordForm";
import { theme } from "@/theme/tokens";
export function RecordFormScreen({ id }: { id?: number }) {
  const form = useRecordForm(id);
  function back() {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/records");
  }
  return (
    <AppScreen tab={false} keyboard>
      <AppHeader
        title={id === undefined ? "Add Record" : "Edit Record"}
        onBack={back}
      />
      <AppText muted>
        One daily summary per date. Your records stay on this device.
      </AppText>
      {form.loading ? (
        <ActivityIndicator
          accessibilityLabel="Loading record"
          color={theme.colors.primary}
        />
      ) : form.loadError ? (
        <>
          <AppText accessibilityRole="alert">{form.loadError}</AppText>
          <AppButton label="Retry loading" onPress={form.retry} />
          <AppButton
            label="Return to Records"
            onPress={() => router.replace("/(tabs)/records")}
          />
        </>
      ) : (
        <>
          <DateField
            value={form.fields.date}
            onChange={(value) => form.change("date", value)}
            error={form.errors.date}
            disabled={form.mutating}
          />
          <MeasurementField
            label="Steps walked (steps)"
            value={form.fields.steps}
            onChange={(value) => form.change("steps", value)}
            error={form.errors.steps}
            disabled={form.mutating}
          />
          <MeasurementField
            label="Calories burned (kcal)"
            value={form.fields.calories}
            onChange={(value) => form.change("calories", value)}
            error={form.errors.calories}
            disabled={form.mutating}
          />
          <MeasurementField
            label="Water intake (ml)"
            value={form.fields.water}
            onChange={(value) => form.change("water", value)}
            error={form.errors.water}
            disabled={form.mutating}
          />
          <AppText variant="caption" muted>
            Enter whole numbers, including 0. Maximums: 200,000 steps, 20,000
            kcal and 20,000 ml.
          </AppText>
          {form.error && (
            <AppText
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={{ color: theme.colors.error }}
            >
              {form.error}
            </AppText>
          )}
          {form.duplicateId !== undefined && (
            <AppButton
              label="Edit existing daily record"
              variant="secondary"
              onPress={() =>
                router.replace({
                  pathname: "/edit-record/[id]",
                  params: { id: String(form.duplicateId) },
                })
              }
            />
          )}
          <AppButton
            label={
              form.mutating
                ? "Saving…"
                : id === undefined
                  ? "Save Record"
                  : "Save Changes"
            }
            icon="checkmark"
            disabled={form.mutating}
            onPress={() => {
              Keyboard.dismiss();
              void form.save();
            }}
          />
          <AppButton
            label="Cancel"
            variant="secondary"
            disabled={form.mutating}
            onPress={back}
          />
        </>
      )}
    </AppScreen>
  );
}
