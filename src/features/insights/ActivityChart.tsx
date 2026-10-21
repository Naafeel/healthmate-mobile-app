import { ScrollView, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { calendarDate } from "@/domain/records/validation";
import { theme } from "@/theme/tokens";
import {
  formatAnalyticsDate,
  formatAnalyticsNumber,
  type ChartDay,
} from "./analytics";
export function ActivityChart({
  days,
  label,
  unit,
  color,
}: {
  days: ChartDay[];
  label: string;
  unit: string;
  color: string;
}) {
  const maximum = Math.max(1, ...days.map((day) => day.value ?? 0));
  return (
    <AppCard>
      <AppText variant="heading" accessibilityRole="header">
        {label} by day
      </AppText>
      <AppText variant="caption" muted>
        Values in {unit}. Swipe horizontally to view every day.
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        accessibilityLabel={`${label} daily chart`}
      >
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.small,
            paddingBottom: theme.spacing.small,
          }}
        >
          {days.map((day) => {
            const text =
              day.status === "recorded"
                ? `${formatAnalyticsNumber(day.value)} ${unit}`
                : day.status === "future"
                  ? "Future date"
                  : "Not recorded";
            return (
              <View
                key={day.date}
                accessible
                accessibilityLabel={`${formatAnalyticsDate(day.date)}: ${text}`}
                style={{
                  width: 72,
                  gap: theme.spacing.small,
                  alignItems: "center",
                }}
              >
                <AppText
                  variant="caption"
                  style={{ textAlign: "center", minHeight: 40 }}
                >
                  {day.status === "recorded"
                    ? formatAnalyticsNumber(day.value)
                    : day.status === "future"
                      ? "Future"
                      : "—"}
                </AppText>
                <View
                  style={{
                    height: 120,
                    width: 32,
                    justifyContent: "flex-end",
                    borderBottomWidth: 1,
                    borderColor: theme.colors.muted,
                  }}
                >
                  {day.status === "recorded" ? (
                    <View
                      style={{
                        height:
                          day.value === 0
                            ? 3
                            : Math.max(3, (day.value / maximum) * 120),
                        backgroundColor: color,
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <AppText
                      variant="caption"
                      muted
                      style={{ textAlign: "center" }}
                    >
                      {day.status === "future" ? "·" : "—"}
                    </AppText>
                  )}
                </View>
                <AppText variant="caption" style={{ textAlign: "center" }}>
                  {new Intl.DateTimeFormat(undefined, {
                    weekday: "short",
                  }).format(calendarDate(day.date))}
                  {"\n"}
                  {Number(day.date.slice(-2))}
                </AppText>
                <AppText
                  variant="caption"
                  muted
                  style={{ textAlign: "center" }}
                >
                  {day.status === "recorded"
                    ? day.value === 0
                      ? "Saved 0"
                      : "Saved"
                    : day.status === "future"
                      ? "Future"
                      : "No entry"}
                </AppText>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <AppText variant="caption" muted>
        Each date has its own position. A baseline bar marked “Saved 0” is a
        real zero; “No entry” is missing. Future days have no measurements.
        Heights are relative to this period’s highest value.
      </AppText>
    </AppCard>
  );
}
