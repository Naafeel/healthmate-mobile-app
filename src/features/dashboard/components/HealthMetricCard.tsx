import { StyleSheet, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppIcon, type IconName } from "@/components/AppIcon";
import { AppText } from "@/components/AppText";
import { theme } from "@/theme/tokens";
import { formatMeasurement } from "../dashboardSelectors";
type Props = {
  label: string;
  value: number;
  unit: string;
  icon: IconName;
  tone: "steps" | "calories" | "water";
};
export function HealthMetricCard({ label, value, unit, icon, tone }: Props) {
  const color = theme.metrics[tone];
  const formatted = formatMeasurement(value);
  return (
    <AppCard
      accessible
      accessibilityLabel={label + ": " + formatted + " " + unit}
      style={styles.card}
    >
      <View style={[styles.icon, { backgroundColor: color.background }]}>
        <AppIcon name={icon} color={color.foreground} size={theme.icon.large} />
      </View>
      <View style={styles.copy}>
        <AppText variant="label" muted>
          {label}
        </AppText>
        <AppText variant="title" style={{ color: color.foreground }}>
          {formatted}{" "}
          <AppText variant="body" muted>
            {unit}
          </AppText>
        </AppText>
      </View>
    </AppCard>
  );
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.medium,
    padding: theme.spacing.medium,
  },
  icon: {
    width: theme.size.touch,
    height: theme.size.touch,
    borderRadius: theme.radius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: theme.spacing.tiny },
});
