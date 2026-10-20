import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HealthIcon } from '@/components/HealthIcon';
import { theme } from '@/theme/tokens';

export function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <HealthIcon />
          <Text style={styles.eyebrow}>WELCOME TO</Text>
          <Text accessibilityRole="header" style={styles.title}>HealthMate</Text>
          <Text style={styles.subtitle}>Personal Health & Wellness Tracker</Text>
          <View style={styles.divider} />
          <Text style={styles.description}>A little care. Every day.</Text>
          <Text style={styles.note}>Your personal wellness journey starts here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.large },
  card: {
    width: '100%', maxWidth: 480, alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.card,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.large, paddingVertical: theme.spacing.extraLarge,
  },
  eyebrow: { marginTop: 32, fontSize: 12, fontWeight: '700', letterSpacing: 2, color: theme.colors.primary },
  title: { marginTop: theme.spacing.small, fontSize: 38, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  subtitle: { marginTop: 12, fontSize: 18, lineHeight: 27, color: theme.colors.muted, textAlign: 'center' },
  divider: { height: 1, width: 48, backgroundColor: theme.colors.border, marginVertical: 28 },
  description: { fontSize: 18, fontWeight: '600', color: theme.colors.text, textAlign: 'center' },
  note: { marginTop: 12, fontSize: 15, lineHeight: 23, color: theme.colors.muted, textAlign: 'center' },
});
