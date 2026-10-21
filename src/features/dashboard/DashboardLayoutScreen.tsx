import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { usePersonalization } from "@/store/personalization";
import { defaultLayout, moveWidget } from "@/domain/dashboard/layout";
const names = {
  steps: "Steps",
  calories: "Calories",
  water: "Water",
  goals: "Goal Progress",
  streak: "Logging Streak",
  quickWater: "Quick Add Water",
};
export function DashboardLayoutScreen() {
  const state = usePersonalization();
  return (
    <AppScreen tab={false}>
      <AppHeader title="Customize Dashboard" onBack={() => router.back()} />
      <AppText muted>
        Changes save on this device. Hidden measurements remain available in
        Records, Insights, backups and CSV. Goal Progress controls the goal bars
        on visible metric cards.
      </AppText>
      {state.layout.map((w, i) => (
        <AppCard key={w.id}>
          <AppText variant="heading">{names[w.id]}</AppText>
          <AppText>
            {w.visible ? "Shown" : "Hidden"} · Position {i + 1}
          </AppText>
          <AppButton
            label={`${w.visible ? "Hide" : "Show"} ${names[w.id]}`}
            disabled={!state.loaded || state.busy}
            variant="secondary"
            onPress={() =>
              void state.saveLayout(
                state.layout.map((v) =>
                  v.id === w.id ? { ...v, visible: !v.visible } : v,
                ),
              )
            }
          />
          <AppButton
            label={`Move ${names[w.id]} up`}
            variant="secondary"
            disabled={!state.loaded || state.busy || i === 0}
            onPress={() =>
              void state.saveLayout(moveWidget(state.layout, w.id, -1))
            }
          />
          <AppButton
            label={`Move ${names[w.id]} down`}
            variant="secondary"
            disabled={
              !state.loaded || state.busy || i === state.layout.length - 1
            }
            onPress={() =>
              void state.saveLayout(moveWidget(state.layout, w.id, 1))
            }
          />
        </AppCard>
      ))}
      <AppButton
        label="Restore default dashboard"
        disabled={!state.loaded || state.busy}
        onPress={() => void state.saveLayout(defaultLayout())}
      />
      {state.error && (
        <AppText accessibilityRole="alert">{state.error}</AppText>
      )}
      {!state.loaded && (
        <AppButton
          label="Retry loading layout"
          onPress={() => void state.refresh()}
        />
      )}
    </AppScreen>
  );
}
