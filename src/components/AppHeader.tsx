import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { AppIcon } from "./AppIcon";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
export function AppHeader({
  title,
  eyebrow,
  onBack,
}: {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
        >
          <AppIcon name="arrow-back" />
        </Pressable>
      )}
      <View style={styles.title}>
        {eyebrow && (
          <AppText variant="eyebrow" muted>
            {eyebrow}
          </AppText>
        )}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      </View>
    </View>
  );
}
const createStyles = (theme: Theme) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.compact,
  },
  title: { flex: 1, gap: theme.spacing.tiny },
  back: {
    minWidth: theme.size.touch,
    minHeight: theme.size.touch,
    borderRadius: theme.radius.small,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
