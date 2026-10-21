import { StyleSheet, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppIcon, type IconName } from "@/components/AppIcon";
import { AppText } from "@/components/AppText";
import { theme } from "@/theme/tokens";
import { formatMeasurement } from "../dashboardSelectors";
import { GoalProgressBar } from "./GoalProgressBar";
type Props = {
  label: string;
  value: number;
  unit: string;
  icon: IconName;
  tone: "steps" | "calories" | "water";
  goal?: number | null;
  goalsAvailable?: boolean;
};
export function HealthMetricCard({
  label,
  value,
  unit,
  icon,
  tone,
  goal = null,
  goalsAvailable = false,
}: Props) {
  const color = theme.metrics[tone];
  const formatted = formatMeasurement(value);
  return (
    <AppCard style={styles.card}>
      <View style={[styles.icon, { backgroundColor: color.background }]}>
        <AppIcon name={icon} color={color.foreground} size={theme.icon.large} />
      </View>
      <View style={styles.copy}>
        <AppText variant="label" muted>
          {label}
        </AppText>
        <AppText
          accessibilityLabel={label + ": " + formatted + " " + unit}
          variant="title"
          style={{ color: color.foreground }}
        >
          {formatted}{" "}
          <AppText variant="body" muted>
            {unit}
          </AppText>
        </AppText>
        {goalsAvailable ? (
          <GoalProgressBar
            actual={value}
            goal={goal}
            unit={unit}
            color={color.foreground}
          />
        ) : (
          <AppText variant="caption" muted>
            Goal progress unavailable
          </AppText>
        )}
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
