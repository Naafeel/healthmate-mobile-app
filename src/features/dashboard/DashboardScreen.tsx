import { usePersonalization } from "@/store/personalization";
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
  const profile = usePersonalization((s) => s.profile);
  const layout = usePersonalization((s) => s.layout);
  const showGoals = layout.some((w) => w.id === "goals" && w.visible);
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
      {!!profile.name && (
        <AppText variant="heading">Hello, {profile.name}</AppText>
      )}
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
          {!summary.today && (
            <EmptyState
              icon="heart-outline"
              title="No activity recorded today"
              description="Add today's activities manually to see your saved measurements."
            />
          )}
          {layout
            .filter((w) => w.visible)
            .map((w) => (
              <View key={w.id}>
                {(["steps", "calories", "water"] as const).map((metric) =>
                  w.id === metric && summary.today ? (
                    <HealthMetricCard
                      key={metric}
                      label={
                        {
                          steps: "Steps walked",
                          calories: "Calories burned",
                          water: "Water intake",
                        }[metric]
                      }
                      value={summary.today[metric]}
                      unit={
                        { steps: "steps", calories: "kcal", water: "ml" }[
                          metric
                        ]
                      }
                      icon={
                        {
                          steps: "footsteps-outline",
                          calories: "flame-outline",
                          water: "water-outline",
                        }[metric] as
                          | "footsteps-outline"
                          | "flame-outline"
                          | "water-outline"
                      }
                      tone={metric}
                      goal={goals[metric]}
                      goalsAvailable={!!goalsAvailable}
                      showProgress={showGoals}
                    />
                  ) : null,
                )}
                {w.id === "quickWater" && <QuickWater today={today} />}
                {w.id === "goals" && (
                  <AppButton
                    label={
                      goalsError
                        ? "Retry or edit goals in Settings"
                        : "Set or edit daily goals"
                    }
                    variant="secondary"
                    icon="options-outline"
                    onPress={() => router.navigate("/(tabs)/settings")}
                  />
                )}
                {w.id === "streak" && (
                  <AppCard>
                    <AppText variant="heading">Logging Streak</AppText>
                    <AppText>
                      Current: {streaks?.current ?? 0} days / Longest:{" "}
                      {streaks?.longest ?? 0} days
                    </AppText>
                    <AppText muted>
                      Consecutive saved dates, including zeros. This measures
                      logging, not health or goal achievement.
                    </AppText>
                  </AppCard>
                )}
              </View>
            ))}
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
const createStyles = (theme: Theme) =>
  StyleSheet.create({ section: { gap: theme.spacing.compact } });
