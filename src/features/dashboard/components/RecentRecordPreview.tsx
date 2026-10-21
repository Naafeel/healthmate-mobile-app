import { StyleSheet, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppIcon } from "@/components/AppIcon";
import { AppText } from "@/components/AppText";
import type { HealthRecord } from "@/domain/models/HealthRecord";
import { theme } from "@/theme/tokens";
import { formatMeasurement, formatRecentDate } from "../dashboardSelectors";
export function RecentRecordPreview({
  record,
  today,
}: {
  record: HealthRecord;
  today: string;
}) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.date}>
        <AppIcon name="calendar-outline" size={theme.icon.small} />
        <AppText variant="label" style={styles.dateText}>
          {formatRecentDate(record.date, today)}
        </AppText>
      </View>
      <AppText variant="caption" muted>
        {formatMeasurement(record.steps)} steps ·{" "}
        {formatMeasurement(record.calories)} kcal burned ·{" "}
        {formatMeasurement(record.water)} ml water
      </AppText>
    </AppCard>
  );
}
const styles = StyleSheet.create({
  card: { padding: theme.spacing.medium },
  date: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.small,
  },
  dateText: { flex: 1 },
});
