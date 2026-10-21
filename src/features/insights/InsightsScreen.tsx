import { TrendComparison } from "./TrendComparison";
import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { EmptyState } from "@/components/EmptyState";
import { useRecordOverview } from "@/hooks/useRecordOverview";
import type { Metric } from "@/domain/models/HealthGoals";
import { useTheme } from "@/theme/useTheme";
import { ActivityChart } from "./ActivityChart";
import { SelectionControl } from "./SelectionControl";
import {
  adjacentPeriod,
  analyticsState,
  formatAnalyticsDate,
  formatAnalyticsNumber as number,
  periodFor,
  type PeriodMode,
} from "./analytics";
const metrics = {
  steps: { label: "Steps", unit: "steps" },
  calories: { label: "Calories burned", unit: "kcal" },
  water: { label: "Water intake", unit: "ml" },
};
export function InsightsScreen() {
  const theme = useTheme();
  const state = useRecordOverview();
  const [mode, setMode] = useState<PeriodMode>("weekly"),
    [metric, setMetric] = useState<Metric>("steps");
  const [anchor, setAnchor] = useState<string | null>(null);
  const current = periodFor(state.today, mode);
  const period = useMemo(
    () =>
      periodFor(anchor && anchor < current.start ? anchor : state.today, mode),
    [anchor, current.start, state.today, mode],
  );
  const result = useMemo(
    () =>
      analyticsState(
        state.records,
        metric,
        period,
        state.today,
        state.hasLoaded,
        state.error,
      ),
    [state.records, metric, period, state.today, state.hasLoaded, state.error],
  );
  const selected = metrics[metric];
  function move(direction: -1 | 1) {
    const next = adjacentPeriod(period, mode, direction, state.today);
    setAnchor(next.start === current.start ? null : next.start);
  }
  return (
    <AppScreen>
      <AppHeader eyebrow="SEE THE BIGGER PICTURE" title="Insights" />
      <AppText muted>Your saved activity, one calendar day at a time.</AppText>
      <SelectionControl
        label="Period"
        value={mode}
        options={[
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
        ]}
        onChange={(value) => {
          setMode(value);
          setAnchor(null);
        }}
      />
      <AppCard>
        <AppText variant="heading" accessibilityRole="header">
          {formatAnalyticsDate(period.start)} –{" "}
          {formatAnalyticsDate(period.end)}
        </AppText>
        <AppText variant="caption" muted>
          {mode === "weekly" ? "Monday to Sunday" : "Calendar month"}
          {period.start === current.start ? " · Current period" : ""}
        </AppText>
        <View style={{ gap: theme.spacing.small }}>
          <AppButton
            label="Previous period"
            icon="chevron-back"
            variant="secondary"
            onPress={() => move(-1)}
          />
          <AppButton
            label="Next period"
            icon="chevron-forward"
            variant="secondary"
            disabled={period.start >= current.start}
            onPress={() => move(1)}
          />
        </View>
      </AppCard>
      <SelectionControl
        label="Activity metric"
        value={metric}
        options={(Object.keys(metrics) as Metric[]).map((value) => ({
          value,
          label: metrics[value].label,
          color: theme.metrics[value].foreground,
        }))}
        onChange={setMetric}
      />
      {result.status === "loading" ? (
        <AppCard>
          <ActivityIndicator
            accessibilityLabel="Loading insights"
            color={theme.colors.primary}
          />
          <AppText muted>Loading saved activity…</AppText>
        </AppCard>
      ) : result.status === "error" ? (
        <AppCard>
          <AppText accessibilityRole="alert">{result.message}</AppText>
          <AppButton label="Retry loading insights" onPress={state.retry} />
        </AppCard>
      ) : (
        <>
          {state.loading && (
            <AppText accessibilityLiveRegion="polite" muted>
              Refreshing saved activity…
            </AppText>
          )}
          {!result.data.count && (
            <EmptyState
              icon="bar-chart-outline"
              title="No records in this period"
              description="Only saved daily entries appear in Insights. Missing days are not counted as zero."
            />
          )}
          <AppCard>
            <AppText variant="heading" accessibilityRole="header">
              {selected.label} summary
            </AppText>
            <AppText>Recorded days: {result.data.count}</AppText>
            {result.data.count ? (
              <>
                <AppText>
                  Total: {number(result.data.total!)} {selected.unit}
                </AppText>
                <AppText>
                  Average per recorded day: {number(result.data.average!)}{" "}
                  {selected.unit}
                </AppText>
                <AppText>
                  Highest: {number(result.data.highest!.value)} {selected.unit}{" "}
                  · {formatAnalyticsDate(result.data.highest!.date)}
                </AppText>
              </>
            ) : (
              <AppText muted>
                Total, average and highest are unavailable until a day is
                recorded.
              </AppText>
            )}
            <AppText variant="caption" muted>
              Averages include saved zero days and exclude missing and future
              days. Values round to one decimal. Earliest day wins a
              highest-value tie.
            </AppText>
          </AppCard>
          <TrendComparison records={state.records} metric={metric} period={period} mode={mode} today={state.today} unit={selected.unit} />
          <ActivityChart
            key={`${mode}:${period.start}:${metric}`}
            days={result.data.days}
            label={selected.label}
            unit={selected.unit}
            color={theme.metrics[metric].foreground}
          />
          <AppText variant="caption" muted>
            Insights show recorded activity only. Today’s goal settings are not
            applied to historical dates.
          </AppText>
        </>
      )}
    </AppScreen>
  );
}
