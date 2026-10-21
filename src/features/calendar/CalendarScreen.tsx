import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { useRecordOverview } from "@/hooks/useRecordOverview";
import {
  monthGrid,
  selectCalendarDay,
  calendarRecordAction,
} from "@/domain/calendar/activityCalendar";
import { calendarDate } from "@/domain/records/validation";
import { periodFor, adjacentPeriod } from "@/domain/calendar/periods";
import { theme } from "@/theme/tokens";
export function CalendarScreen() {
  const state = useRecordOverview();
  const [anchor, setAnchor] = useState<string | null>(null),
    [selection, setSelection] = useState<string | null>(null);
  const current = periodFor(state.today, "monthly");
  const period = periodFor(
    anchor && anchor < current.start ? anchor : state.today,
    "monthly",
  );
  const selectedDate =
    selection && selection >= period.start && selection <= period.end
      ? selection
      : period.start === current.start
        ? state.today
        : period.start;
  const grid = useMemo(() => monthGrid(period.start), [period.start]);
  const recorded = useMemo(
    () =>
      new Set(
        state.records
          .filter((row) => row.date <= state.today)
          .map((row) => row.date),
      ),
    [state.records, state.today],
  );
  const day = selectCalendarDay(state.records, selectedDate, state.today),
    action = calendarRecordAction(day);
  function move(direction: -1 | 1) {
    const next = adjacentPeriod(period, "monthly", direction, state.today);
    setAnchor(next.start === current.start ? null : next.start);
    setSelection(null);
  }
  return (
    <AppScreen tab={false}>
      <AppHeader
        title="Activity Calendar"
        eyebrow="YOUR HEALTH JOURNAL"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)/records")
        }
      />
      <AppText muted>
        Explore saved daily entries. A logged day includes records with zero
        measurements.
      </AppText>
      <AppCard>
        <AppText variant="heading" accessibilityRole="header">
          {new Intl.DateTimeFormat(undefined, {
            month: "long",
            year: "numeric",
          }).format(calendarDate(period.start))}
        </AppText>
        <AppButton
          label="Previous month"
          variant="secondary"
          icon="chevron-back"
          disabled={period.start <= "1900-01-01"}
          onPress={() => move(-1)}
        />
        <AppButton
          label="Next month"
          variant="secondary"
          icon="chevron-forward"
          disabled={period.start >= current.start}
          onPress={() => move(1)}
        />
        <AppButton
          label="Current month"
          variant="secondary"
          icon="today-outline"
          onPress={() => {
            setAnchor(null);
            setSelection(state.today);
          }}
        />
      </AppCard>
      {state.error ? (
        <AppCard>
          <AppText accessibilityRole="alert">{state.error}</AppText>
          <AppButton label="Retry loading calendar" onPress={state.retry} />
        </AppCard>
      ) : !state.hasLoaded ? (
        <AppCard>
          <ActivityIndicator accessibilityLabel="Loading activity calendar" />
          <AppText muted>Loading saved records…</AppText>
        </AppCard>
      ) : (
        <>
          {state.loading && (
            <AppText accessibilityLiveRegion="polite" muted>
              Refreshing saved records…
            </AppText>
          )}
          <AppText variant="caption" muted>
            ● Saved entry · — No entry · Future dates cannot be logged. Today is
            labelled T; selection has a border. Swipe the grid horizontally on
            narrow screens.
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={{ flex: 1, minWidth: 7 * theme.size.touch }}>
              <View style={{ flexDirection: "row" }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (label) => (
                    <View
                      key={label}
                      style={{
                        flex: 1,
                        flexBasis: 0,
                        minWidth: theme.size.touch,
                        alignItems: "center",
                        paddingVertical: 8,
                      }}
                    >
                      <AppText variant="caption">{label}</AppText>
                    </View>
                  ),
                )}
              </View>
              {grid.map((week, index) => (
                <View key={index} style={{ flexDirection: "row" }}>
                  {week.map((date, column) => {
                    if (!date)
                      return (
                        <View
                          key={`blank-${column}`}
                          style={{
                            flex: 1,
                            flexBasis: 0,
                            minWidth: theme.size.touch,
                          }}
                        />
                      );
                    const future = date > state.today,
                      saved = recorded.has(date),
                      today = date === state.today,
                      selected = date === selectedDate;
                    return (
                      <Pressable
                        key={date}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${date}${today ? ", today" : ""}, ${future ? "future date; logging unavailable" : saved ? "saved entry" : "no entry"}`}
                        onPress={() => setSelection(date)}
                        style={({ pressed }) => ({
                          flex: 1,
                          flexBasis: 0,
                          minHeight: 68,
                          minWidth: 48,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingVertical: 8,
                          borderRadius: 12,
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.border,
                          backgroundColor: selected
                            ? theme.colors.primarySoft
                            : theme.colors.surface,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <AppText
                          variant="label"
                          style={{
                            color: future
                              ? theme.colors.muted
                              : theme.colors.text,
                          }}
                        >
                          {Number(date.slice(-2))}
                          {today ? " T" : ""}
                        </AppText>
                        <AppText variant="caption" muted>
                          {future ? "·" : saved ? "●" : "—"}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
          <AppCard>
            <AppText variant="heading" accessibilityRole="header">
              {selectedDate}
            </AppText>
            {day.record ? (
              <>
                <AppText>
                  Steps walked: {day.record.steps.toLocaleString()} steps
                </AppText>
                <AppText>
                  Calories burned: {day.record.calories.toLocaleString()} kcal
                </AppText>
                <AppText>
                  Water intake: {day.record.water.toLocaleString()} ml
                </AppText>
              </>
            ) : (
              <AppText muted>
                {day.status === "future"
                  ? "This date is in the future. Completed activity cannot be recorded yet."
                  : "No record has been saved for this date."}
              </AppText>
            )}
            {action && (
              <AppButton
                label={
                  day.record ? "Edit selected record" : "Add selected date"
                }
                icon={day.record ? "create-outline" : "add"}
                disabled={state.loading || state.mutating}
                onPress={() => router.push(action)}
              />
            )}
          </AppCard>
        </>
      )}
    </AppScreen>
  );
}
