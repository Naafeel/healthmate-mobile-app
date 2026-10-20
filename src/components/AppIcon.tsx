import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { theme } from '@/theme/tokens';
export type IconName = ComponentProps<typeof Ionicons>['name'];
export function AppIcon({ name, color = theme.colors.primary, size = theme.icon.medium }: { name: IconName; color?: string; size?: number }) {
  return <Ionicons accessible={false} importantForAccessibility="no-hide-descendants" name={name} color={color} size={size} />;
}
