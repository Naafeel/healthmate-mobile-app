import { View, StyleSheet, type ViewProps } from "react-native";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
export function AppCard({ style, ...props }: ViewProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return <View {...props} style={[styles.card, style]} />;
}
const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.border.width,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: theme.spacing.large,
    gap: theme.spacing.compact,
    elevation: theme.elevation.card,
  },
});
