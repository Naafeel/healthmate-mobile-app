import { View, StyleSheet, type ViewProps } from 'react-native';
import { theme } from '@/theme/tokens';
export function AppCard({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}
const styles = StyleSheet.create({ card: {
  backgroundColor: theme.colors.surface, borderWidth: theme.border.width,
  borderColor: theme.colors.border, borderRadius: theme.radius.card,
  padding: theme.spacing.large, gap: theme.spacing.compact, elevation: theme.elevation.card,
} });
