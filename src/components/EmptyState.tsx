import { View, StyleSheet } from "react-native";
import { AppCard } from "./AppCard";
import { AppIcon, type IconName } from "./AppIcon";
import { AppText } from "./AppText";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <AppCard style={styles.card}>
      <View style={styles.icon}>
        <AppIcon name={icon} size={theme.icon.large} />
      </View>
      <AppText variant="heading" accessibilityRole="header" style={styles.text}>
        {title}
      </AppText>
      <AppText muted style={styles.text}>
        {description}
      </AppText>
    </AppCard>
  );
}
const createStyles = (theme: Theme) => StyleSheet.create({
  card: { alignItems: "center", paddingVertical: theme.spacing.roomy },
  icon: {
    width: theme.size.iconTile,
    height: theme.size.iconTile,
    borderRadius: theme.radius.icon,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.small,
  },
  text: { textAlign: "center" },
});
