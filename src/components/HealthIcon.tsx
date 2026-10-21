import { StyleSheet, View } from "react-native";

import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

/** A local, font-independent health cross. Decorative beside the screen title. */
export function HealthIcon() {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View
      style={styles.container}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.horizontal} />
      <View style={styles.vertical} />
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.icon,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontal: {
    position: "absolute",
    width: 40,
    height: 12,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  vertical: {
    position: "absolute",
    width: 12,
    height: 40,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});
