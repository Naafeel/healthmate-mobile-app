import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppIcon } from "@/components/AppIcon";
import { achievements } from "@/domain/achievements/achievements";
import { useHealthRecords } from "@/store/healthRecords";
import { AppButton } from "@/components/AppButton";
import { healthGoalStore, useHealthGoals } from "@/store/healthGoals";
import { useRecordOverview } from "@/hooks/useRecordOverview";
export function AchievementsScreen() {
  const state = useRecordOverview();
  const today = state.today;
  const goalsLoaded = useHealthGoals((s) => s.hasLoaded),
    goalsError = useHealthGoals((s) => s.error);
  const records = useHealthRecords((s) => s.records),
    goals = useHealthGoals((s) => s.goals);
  return (
    <AppScreen tab={false}>
      <AppHeader
        title="Achievements"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace("/(tabs)/settings")
        }
      />
      <AppText muted>
        Milestones currently supported by your saved history. Editing or
        deleting records can lock them again. Logging runs use your longest
        saved run.
      </AppText>
      <AppText muted>
        Goal badges compare saved days with your current goals, because
        historical goal values are not stored. These are personal tracking
        milestones.
      </AppText>
      {!state.hasLoaded || state.error || !goalsLoaded || goalsError ? (
        <AppCard>
          <AppText accessibilityRole="alert">
            {state.error ?? goalsError ?? "Loading saved records and goals..."}
          </AppText>
          <AppButton
            label="Retry loading achievements"
            onPress={() => {
              state.retry();
              void healthGoalStore.getState().refresh();
            }}
          />
        </AppCard>
      ) : (
        achievements(records, goals, today).map((b) => (
          <AppCard key={b.id}>
            <AppIcon
              name={b.unlocked ? "trophy-outline" : "lock-closed-outline"}
            />
            <AppText variant="heading">{b.name}</AppText>
            <AppText>{b.description}</AppText>
            <AppText
              accessibilityLabel={`${b.name}: ${b.unlocked ? "unlocked" : "locked"}, ${b.progress} of ${b.target}`}
            >
              {b.unlocked ? "Unlocked" : "Locked"} · {b.progress} of {b.target}
            </AppText>
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}
