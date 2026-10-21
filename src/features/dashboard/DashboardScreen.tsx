import { QuickWater } from "./QuickWater";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { EmptyState } from "@/components/EmptyState";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { useDashboard } from "./useDashboard";
import { formatDashboardDate } from "./dashboardSelectors";
import { HealthMetricCard } from "./components/HealthMetricCard";
import { RecentRecordPreview } from "./components/RecentRecordPreview";
import { useHealthGoals } from "@/store/healthGoals";
export function DashboardScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { today, summary, retry, streaks } = useDashboard();
  const goals = useHealthGoals((s) => s.goals);
  const goalsLoaded = useHealthGoals((s) => s.hasLoaded);
  const goalsLoading = useHealthGoals((s) => s.loading);
  const goalsError = useHealthGoals((s) => s.error);
  const goalsAvailable = goalsLoaded && !goalsLoading && !goalsError;
  function viewRecords() {
    router.navigate("/(tabs)/records");
  }
  return (
    <AppScreen>
      <AppHeader eyebrow="HEALTHMATE" title="A little care, every day" />
      <AppText muted>{formatDashboardDate(today)}</AppText>
      <View style={styles.section}>
        <AppText variant="heading" accessibilityRole="header">
          Today’s Overview
        </AppText>
        <AppText variant="caption" muted>
          Manually recorded daily totals
        </AppText>
      </View>
      {summary.status === "loading" ? (
        <AppCard>
          <ActivityIndicator
            accessibilityLabel="Loading your health records"
            color={theme.colors.primary}
          />
          <AppText accessibilityLiveRegion="polite" muted>
            Loading your saved activities…
          </AppText>
        </AppCard>
      ) : summary.status === "error" ? (
        <AppCard>
          <AppText variant="heading" accessibilityRole="header">
            Your records could not be loaded
          </AppText>
          <AppText accessibilityRole="alert">{summary.message}</AppText>
          <AppButton
            label="Retry loading dashboard"
            icon="refresh"
            onPress={retry}
          />
        </AppCard>
      ) : (
        <>
          {summary.refreshing && (
            <AppText variant="caption" accessibilityLiveRegion="polite" muted>
              Updating saved activities…
            </AppText>
          )}
          {summary.today ? (
            <View style={styles.section}>
              <HealthMetricCard
                label="Steps walked"
                value={summary.today.steps}
                unit="steps"
                icon="footsteps-outline"
                tone="steps"
                goal={goals.steps}
                goalsAvailable={!!goalsAvailable}
              />
              <HealthMetricCard
                label="Calories burned"
                value={summary.today.calories}
                unit="kcal"
                icon="flame-outline"
                tone="calories"
                goal={goals.calories}
                goalsAvailable={!!goalsAvailable}
              />
              <HealthMetricCard
                label="Water intake"
                value={summary.today.water}
                unit="ml"
                icon="water-outline"
                tone="water"
                goal={goals.water}
                goalsAvailable={!!goalsAvailable}
              />
            </View>
          ) : (
            <EmptyState
              icon="heart-outline"
              title="No activity recorded today"
              description="Add today's activities manually to see your steps, calories burned and water intake here."
            />
          )}
          <QuickWater today={today} />
          <AppButton
            label={
              goalsError
                ? "Retry or edit goals in Settings"
                : goalsLoading
                  ? "Loading goals…"
                  : "Set or edit daily goals"
            }
            variant="secondary"
            icon="options-outline"
            onPress={() => router.navigate("/(tabs)/settings")}
          />
          <AppButton
            label={summary.action.label}
            icon={summary.action.kind === "edit" ? "create-outline" : "add"}
            disabled={summary.busy}
            onPress={() => {
              if (summary.action.kind === "edit")
                router.push({
                  pathname: "/edit-record/[id]",
                  params: { id: String(summary.action.id) },
                });
              else router.push("/add-record");
            }}
          />
          <AppCard>
            <AppText variant="heading" accessibilityRole="header">
              Logging Streak
            </AppText>
            {streaks ? (
              <>
                <AppText>
                  Current: {streaks.current}{" "}
                  {streaks.current === 1 ? "day" : "days"}
                </AppText>
                <AppText>
                  Longest: {streaks.longest}{" "}
                  {streaks.longest === 1 ? "day" : "days"}
                </AppText>
                <AppText variant="caption" muted>
                  Days recorded consecutively. Saved zero entries count. This
                  measures logging, not health or goal achievement.
                </AppText>
                {streaks.longest === 0 && (
                  <AppText muted>
                    Your saved daily entries will build a logging history here.
                  </AppText>
                )}
              </>
            ) : (
              <AppText muted>
                Logging streaks are unavailable until valid records can be
                loaded.
              </AppText>
            )}
          </AppCard>
          <View style={styles.section}>
            <AppText variant="heading" accessibilityRole="header">
              Recent Activity
            </AppText>
            <AppText variant="caption" muted>
              Your three most recent recorded dates
            </AppText>
          </View>
          {summary.recent.length ? (
            <View style={styles.section}>
              {summary.recent.map((record) => (
                <RecentRecordPreview
                  key={record.id}
                  record={record}
                  today={today}
                />
              ))}
            </View>
          ) : (
            <AppCard>
              <AppText variant="heading">Your journal starts here</AppText>
              <AppText muted>
                Saved daily records will appear here. Nothing has been recorded
                yet.
              </AppText>
            </AppCard>
          )}
          <AppButton
            label="View All Records"
            variant="secondary"
            icon="reader-outline"
            onPress={viewRecords}
          />
        </>
      )}
    </AppScreen>
  );
}
const createStyles = (theme: Theme) => StyleSheet.create({ section: { gap: theme.spacing.compact } });
