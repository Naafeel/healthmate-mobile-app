import { usePersonalization } from "@/store/personalization";
import { displayWater } from "@/domain/profile/profile";
import { StyleSheet, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppIcon } from "@/components/AppIcon";
import { AppText } from "@/components/AppText";
import type { HealthRecord } from "@/domain/models/HealthRecord";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
import { formatMeasurement, formatRecentDate } from "../dashboardSelectors";
export function RecentRecordPreview({
  record,
  today,
}: {
  record: HealthRecord;
  today: string;
}) {
  const waterUnit = usePersonalization((s) => s.profile.waterUnit);
  const theme = useTheme();
  const styles = createStyles(theme);
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
        {displayWater(record.water, waterUnit)} water
      </AppText>
    </AppCard>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { padding: theme.spacing.medium },
    date: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.small,
    },
    dateText: { flex: 1 },
  });
