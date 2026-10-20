import { router } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HealthIcon } from "@/components/HealthIcon";
import { theme } from "@/theme/tokens";

export function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <HealthIcon />
          <Text style={styles.eyebrow}>WELCOME TO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            HealthMate
          </Text>
          <Text style={styles.subtitle}>
            Personal Health & Wellness Tracker
          </Text>
          <View style={styles.divider} />
          <Text style={styles.description}>A little care. Every day.</Text>
          <Text style={styles.note}>
            Your personal wellness journey starts here.
          </Text>
          <View style={styles.action}>
            <AppButton
              label="Get Started"
              icon="arrow-forward"
              onPress={() => router.push("/(tabs)/dashboard")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  action: { alignSelf: "stretch", marginTop: theme.spacing.large },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.large,
  },
  card: {
    width: "100%",
    maxWidth: theme.size.welcome,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: theme.border.width,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.large,
    paddingVertical: theme.spacing.extraLarge,
  },
  eyebrow: {
    marginTop: theme.spacing.roomy,
    ...theme.typography.eyebrow,
    color: theme.colors.primary,
  },
  title: {
    marginTop: theme.spacing.small,
    ...theme.typography.hero,
    color: theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: theme.spacing.compact,
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
  },
  divider: {
    height: theme.border.width,
    width: theme.size.touch,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.large,
  },
  description: {
    ...theme.typography.heading,
    color: theme.colors.text,
    textAlign: "center",
  },
  note: {
    marginTop: 12,
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
  },
});
