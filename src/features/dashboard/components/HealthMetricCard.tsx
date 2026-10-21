import { usePersonalization } from "@/store/personalization";
import { displayWater } from "@/domain/profile/profile";
import { StyleSheet, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppIcon, type IconName } from "@/components/AppIcon";
import { AppText } from "@/components/AppText";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
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
  showProgress?: boolean;
};
export function HealthMetricCard({
  label,
  value,
  unit,
  icon,
  tone,
  goal = null,
  goalsAvailable = false,
  showProgress = true,
}: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const color = theme.metrics[tone];
  const waterUnit = usePersonalization((s) => s.profile.waterUnit);
  const formatted =
    tone === "water"
      ? displayWater(value, waterUnit)
      : formatMeasurement(value) + " " + unit;
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
          accessibilityLabel={label + ": " + formatted}
          variant="title"
          style={{ color: color.foreground }}
        >
          {formatted}
        </AppText>
        {!showProgress ? null : goalsAvailable ? (
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
const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
