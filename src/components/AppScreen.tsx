import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Theme } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";
export function AppScreen({
  children,
  tab = true,
  keyboard = false,
}: PropsWithChildren<{ tab?: boolean; keyboard?: boolean }>) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <SafeAreaView
      style={styles.screen}
      edges={
        tab ? ["top", "left", "right"] : ["top", "bottom", "left", "right"]
      }
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboard ? "height" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const createStyles = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, alignItems: "center" },
  content: {
    width: "100%",
    maxWidth: theme.size.content,
    padding: theme.spacing.large,
    gap: theme.spacing.large,
  },
});
