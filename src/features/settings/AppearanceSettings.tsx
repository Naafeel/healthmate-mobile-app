import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { SelectionControl } from "@/features/insights/SelectionControl";
import { usePreferences } from "@/store/preferences";
export function AppearanceSettings() {
  const state = usePreferences();
  return (
    <AppCard>
      <AppText variant="heading" accessibilityRole="header">
        Appearance
      </AppText>
      <AppText muted>
        Choose Light, Dark, or follow your Android system.
      </AppText>
      {state.loaded && !state.busy ? (
        <SelectionControl
          label="Appearance mode"
          value={state.preferences.theme}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
          onChange={(theme) => void state.save({ ...state.preferences, theme })}
        />
      ) : (
        <AppText muted>Loading appearance…</AppText>
      )}
      {state.error && (
        <>
          <AppText accessibilityRole="alert">{state.error}</AppText>
          <AppButton
            label="Retry preferences"
            onPress={() => void state.refresh()}
          />
        </>
      )}
    </AppCard>
  );
}
